<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Schedule;
use App\Models\ScheduleImport;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use SimpleXMLElement;

class AscXmlImportService
{
    /**
     * Period number → [start_time, end_time]
     * This is built from the XML <periods> section at parse time.
     */
    private array $periodTimes = [];

    /**
     * Day bitmask → day_of_week int (1=Mon, 5=Fri)
     * "10000" → 1, "01000" → 2, etc.
     */
    private const DAY_MAP = [
        '10000' => 1,
        '01000' => 2,
        '00100' => 3,
        '00010' => 4,
        '00001' => 5,
    ];

    /**
     * Parse the XML and return a name-matching preview without writing to DB.
     */
    public function preview(string $xmlContent, int $tenantId, int $academicYearId): array
    {
        $xml = $this->parseXml($xmlContent);

        // Index XML entities by their hex IDs
        $periods   = $this->indexPeriods($xml);
        $subjects  = $this->indexByHexId($xml->subjects->subject ?? [], 'subjectid', 'subjectid');
        $teachers  = $this->indexByHexId($xml->teachers->teacher ?? [], 'teacherid', 'teacherid');
        $classes   = $this->indexByHexId($xml->classes->class ?? [], 'classid', 'classid');
        $lessons   = $this->indexByHexId($xml->lessons->lesson ?? [], 'lessonid', 'lessonid');

        // Load current DB entities (name → id)
        $dbTeachers   = Teacher::where('tenant_id', $tenantId)->pluck('id', 'name')->toArray();
        $dbSubjects   = Subject::where('tenant_id', $tenantId)->pluck('id', 'name')->toArray();
        $dbClassrooms = Classroom::where('tenant_id', $tenantId)->pluck('id', 'name')->toArray();

        // Match each XML entity against DB
        $teacherMatches  = $this->matchEntities($teachers, $dbTeachers, 'name');
        $subjectMatches  = $this->matchEntities($subjects, $dbSubjects, 'name');
        $classroomMatches = $this->matchEntities($classes, $dbClassrooms, 'name');

        // Count importable cards
        $cards = $xml->cards->card ?? [];
        $cardsTotal = 0;
        $cardsImportable = 0;
        $cardsSkipped = 0;

        foreach ($cards as $card) {
            $cardsTotal++;
            $lessonId = (string) $card['lessonid'];
            $lesson   = $lessons[$lessonId] ?? null;

            if (!$lesson) {
                $cardsSkipped++;
                continue;
            }

            $teacherHexId  = (string) $lesson['teacherids'];
            $subjectHexId  = (string) $lesson['subjectid'];
            $classHexId    = (string) $lesson['classids'];

            $teacherResolved  = isset($teacherMatches['matched'][$teacherHexId]);
            $subjectResolved  = isset($subjectMatches['matched'][$subjectHexId]);
            $classResolved    = isset($classroomMatches['matched'][$classHexId]);

            if ($teacherResolved && $subjectResolved && $classResolved) {
                $cardsImportable++;
            } else {
                $cardsSkipped++;
            }
        }

        return [
            'teachers'         => $teacherMatches,
            'subjects'         => $subjectMatches,
            'classrooms'       => $classroomMatches,
            'cards_total'      => $cardsTotal,
            'cards_importable' => $cardsImportable,
            'cards_skipped'    => $cardsSkipped,
        ];
    }

    /**
     * Parse the XML and write resolved cards to the schedules table.
     *
     * @param array $autoCreateHexIds  ['teachers' => [...], 'subjects' => [...], 'classrooms' => [...]]
     */
    public function confirm(string $xmlContent, int $tenantId, int $academicYearId, string $filename, array $autoCreateHexIds = []): array
    {
        $xml = $this->parseXml($xmlContent);

        $periods   = $this->indexPeriods($xml);
        $subjects  = $this->indexByHexId($xml->subjects->subject ?? [], 'subjectid', 'subjectid');
        $teachers  = $this->indexByHexId($xml->teachers->teacher ?? [], 'teacherid', 'teacherid');
        $classes   = $this->indexByHexId($xml->classes->class ?? [], 'classid', 'classid');
        $lessons   = $this->indexByHexId($xml->lessons->lesson ?? [], 'lessonid', 'lessonid');

        // Auto-create any checked unmatched entities BEFORE matching
        $created = $this->autoCreate($autoCreateHexIds, $subjects, $teachers, $classes, $tenantId);

        // Now load fresh DB entities (includes just-created ones)
        $dbTeachers   = Teacher::where('tenant_id', $tenantId)->pluck('id', 'name')->toArray();
        $dbSubjects   = Subject::where('tenant_id', $tenantId)->pluck('id', 'name')->toArray();
        $dbClassrooms = Classroom::where('tenant_id', $tenantId)->pluck('id', 'name')->toArray();

        $teacherMatches   = $this->matchEntities($teachers, $dbTeachers, 'name');
        $subjectMatches   = $this->matchEntities($subjects, $dbSubjects, 'name');
        $classroomMatches = $this->matchEntities($classes, $dbClassrooms, 'name');

        $written = 0;
        $skipped = 0;
        $slots   = [];

        foreach ($xml->cards->card ?? [] as $card) {
            $lessonId  = (string) $card['lessonid'];
            $periodNum = (int) $card['period'];
            $dayBits   = (string) $card['days'];
            $dayOfWeek = self::DAY_MAP[$dayBits] ?? null;

            if (!$dayOfWeek) {
                $skipped++;
                continue;
            }

            $lesson = $lessons[$lessonId] ?? null;
            if (!$lesson) {
                $skipped++;
                continue;
            }

            $teacherHexId = (string) $lesson['teacherids'];
            $subjectHexId = (string) $lesson['subjectid'];
            $classHexId   = (string) $lesson['classids'];

            $teacherId   = $teacherMatches['matched'][$teacherHexId]['db_id'] ?? null;
            $subjectId   = $subjectMatches['matched'][$subjectHexId]['db_id'] ?? null;
            $classroomId = $classroomMatches['matched'][$classHexId]['db_id'] ?? null;

            if (!$teacherId || !$subjectId || !$classroomId) {
                $skipped++;
                continue;
            }

            $key = "{$lessonId}-{$dayOfWeek}-{$classroomId}-{$teacherId}-{$subjectId}";

            if (!isset($slots[$key])) {
                $slots[$key] = [
                    'tenant_id'        => $tenantId,
                    'academic_year_id' => $academicYearId,
                    'classroom_id'     => $classroomId,
                    'subject_id'       => $subjectId,
                    'teacher_id'       => $teacherId,
                    'day_of_week'      => $dayOfWeek,
                    'period_start'     => $periodNum,
                    'period_end'       => $periodNum,
                    'start_time'       => $periods[$periodNum]['start'] ?? '00:00:00',
                    'end_time'         => $periods[$periodNum]['end'] ?? '00:00:00',
                ];
            } else {
                if ($periodNum < $slots[$key]['period_start']) {
                    $slots[$key]['period_start'] = $periodNum;
                    $slots[$key]['start_time']   = $periods[$periodNum]['start'] ?? $slots[$key]['start_time'];
                }
                if ($periodNum > $slots[$key]['period_end']) {
                    $slots[$key]['period_end'] = $periodNum;
                    $slots[$key]['end_time']   = $periods[$periodNum]['end'] ?? $slots[$key]['end_time'];
                }
            }
        }

        foreach ($slots as $slot) {
            Schedule::updateOrCreate(
                [
                    'tenant_id'        => $slot['tenant_id'],
                    'academic_year_id' => $slot['academic_year_id'],
                    'classroom_id'     => $slot['classroom_id'],
                    'teacher_id'       => $slot['teacher_id'],
                    'day_of_week'      => $slot['day_of_week'],
                    'period_start'     => $slot['period_start'],
                ],
                $slot
            );
            $written++;
        }

        // Upsert guru_mapel assignments from resolved slots
        $assignments = $this->createGuruMapelAssignments($slots, $tenantId, $academicYearId, $dbSubjects);

        ScheduleImport::create([
            'tenant_id'        => $tenantId,
            'academic_year_id' => $academicYearId,
            'filename'         => $filename,
            'uploaded_by'      => request()->user()->id,
            'status'           => $skipped > 0 ? 'partial' : 'success',
            'summary'          => [
                'written'              => $written,
                'skipped'              => $skipped,
                'auto_created'         => $created,
                'assignments_created'  => $assignments,
            ],
        ]);

        return [
            'written'              => $written,
            'skipped'              => $skipped,
            'auto_created'         => $created,
            'assignments_created'  => $assignments,
        ];
    }

    /**
     * Upsert guru_mapel teacher assignments from all resolved schedule slots.
     * Builds unique (teacher_id, classroom_id, subject_name) combos and
     * calls firstOrCreate so re-running import is idempotent.
     *
     * @param array $slots        Resolved schedule slot data (each has teacher_id, classroom_id, subject_id)
     * @param array $dbSubjects   DB subject id → name map (id as key, name as value)
     * @return int                Number of assignments created (not already existing)
     */
    private function createGuruMapelAssignments(array $slots, int $tenantId, int $academicYearId, array $dbSubjects): int
    {
        // Build id → name map (dbSubjects is name → id from matchEntities, we need id → name)
        $subjectNameById = array_flip($dbSubjects);

        $seen    = [];
        $created = 0;

        foreach ($slots as $slot) {
            $teacherId   = $slot['teacher_id'];
            $classroomId = $slot['classroom_id'];
            $subjectId   = $slot['subject_id'];
            $subjectName = $subjectNameById[$subjectId] ?? null;

            if (!$subjectName) continue;

            // De-duplicate within this import run
            $key = "{$teacherId}-{$classroomId}-{$subjectName}";
            if (isset($seen[$key])) continue;
            $seen[$key] = true;

            $assignment = TeacherAssignment::firstOrCreate([
                'teacher_id'       => $teacherId,
                'classroom_id'     => $classroomId,
                'tenant_id'        => $tenantId,
                'academic_year_id' => $academicYearId,
                'assignment_type'  => 'guru_mapel',
                'subject'          => $subjectName,
            ]);

            if ($assignment->wasRecentlyCreated) $created++;
        }

        return $created;
    }

    /**
     * Create DB records for checked unmatched XML entities.
     * Returns counts of what was actually created.
     */
    private function autoCreate(array $hexIds, array $xmlSubjects, array $xmlTeachers, array $xmlClasses, int $tenantId): array
    {
        $created = ['subjects' => 0, 'classrooms' => 0, 'teachers' => 0];

        // ---- Subjects -------------------------------------------------------
        foreach ($hexIds['subjects'] ?? [] as $hexId) {
            $attrs = $xmlSubjects[$hexId] ?? null;
            if (!$attrs) continue;

            $name = trim($attrs['name'] ?? '');
            $code = strtoupper(trim($attrs['short'] ?? substr($name, 0, 8)));
            $code = substr($code, 0, 20); // enforce VARCHAR(20) limit
            if (!$name) continue;

            Subject::firstOrCreate(
                ['name' => $name, 'tenant_id' => $tenantId],
                ['code' => $code]
            );
            $created['subjects']++;
        }

        // ---- Classrooms -----------------------------------------------------
        foreach ($hexIds['classrooms'] ?? [] as $hexId) {
            $attrs = $xmlClasses[$hexId] ?? null;
            if (!$attrs) continue;

            $name  = trim($attrs['name'] ?? '');
            $short = trim($attrs['short'] ?? $name);
            if (!$name) continue;

            $gradeLevel = $this->detectGradeLevel($name);

            Classroom::firstOrCreate(
                ['name' => $name, 'tenant_id' => $tenantId],
                [
                    'short'       => $short,
                    'grade_level' => $gradeLevel,
                ]
            );
            $created['classrooms']++;
        }

        // ---- Teachers (record only, no user account) ------------------------
        foreach ($hexIds['teachers'] ?? [] as $hexId) {
            $attrs = $xmlTeachers[$hexId] ?? null;
            if (!$attrs) continue;

            // ASC stores full name in 'name', or firstname + lastname separately
            $name = trim($attrs['name'] ?? '');
            if (!$name && isset($attrs['firstname'])) {
                $name = trim(($attrs['firstname'] ?? '') . ' ' . ($attrs['lastname'] ?? ''));
            }
            if (!$name) continue;

            Teacher::firstOrCreate(
                ['name' => $name, 'tenant_id' => $tenantId],
                ['user_id' => null]
            );
            $created['teachers']++;
        }

        return $created;
    }

    /**
     * Attempt to detect a grade level integer from a class name.
     * "7A" → 7, "Kelas 8B" → 8, "XII IPA" → 12, "3B" → 3.
     * Returns null if no leading number is found.
     */
    private function detectGradeLevel(string $name): ?int
    {
        // Match Roman numerals for SMA (X, XI, XII)
        if (preg_match('/\bXII\b/i', $name)) return 12;
        if (preg_match('/\bXI\b/i', $name))  return 11;
        if (preg_match('/\bX\b/i', $name))   return 10;

        // Match leading arabic numeral
        if (preg_match('/(\d+)/', $name, $m)) {
            return (int) $m[1];
        }

        return null;
    }


    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function parseXml(string $content): SimpleXMLElement
    {
        // ASC exports with windows-1252 — convert to UTF-8
        $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
        // Strip the xml declaration so SimpleXML doesn't choke on encoding
        $content = preg_replace('/<\?xml[^>]+\?>/i', '', $content);

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($content);

        if ($xml === false) {
            $errors = array_map(fn($e) => $e->message, libxml_get_errors());
            libxml_clear_errors();
            throw new \RuntimeException('XML parse error: ' . implode('; ', $errors));
        }

        return $xml;
    }

    /** Build a period number → [start, end] map from the XML. */
    private function indexPeriods(SimpleXMLElement $xml): array
    {
        $periods = [];
        foreach ($xml->periods->period ?? [] as $p) {
            $num = (int) $p['period'];
            $periods[$num] = [
                'start' => $this->normalizeTime((string) $p['starttime']),
                'end'   => $this->normalizeTime((string) $p['endtime']),
            ];
        }
        return $periods;
    }

    /** Normalize "7:15" → "07:15:00". */
    private function normalizeTime(string $time): string
    {
        $parts = explode(':', $time);
        $h = str_pad($parts[0] ?? '0', 2, '0', STR_PAD_LEFT);
        $m = str_pad($parts[1] ?? '0', 2, '0', STR_PAD_LEFT);
        return "{$h}:{$m}:00";
    }

    /**
     * Turn an XML node list into an associative array keyed by the element's `id` attribute.
     * Each value is an associative array of all element attributes.
     */
    private function indexByHexId(iterable $nodes, string $idAttr, string $labelAttr): array
    {
        $map = [];
        foreach ($nodes as $node) {
            $id = (string) $node['id'];
            if ($id) {
                $attrs = [];
                foreach ($node->attributes() as $k => $v) {
                    $attrs[(string) $k] = (string) $v;
                }
                $map[$id] = $attrs;
            }
        }
        return $map;
    }

    /**
     * Match XML entities (keyed by hex ID) against DB entities (keyed by name → id).
     * Returns ['matched' => [...], 'unmatched' => [...]].
     */
    private function matchEntities(array $xmlEntities, array $dbByName, string $nameField): array
    {
        // Normalize DB keys for case-insensitive comparison
        $dbNormalized = [];
        foreach ($dbByName as $name => $id) {
            $dbNormalized[mb_strtolower(trim($name))] = ['db_id' => $id, 'db_name' => $name];
        }

        $matched   = [];
        $unmatched = [];

        foreach ($xmlEntities as $hexId => $attrs) {
            $xmlName  = trim($attrs['name'] ?? '');
            $normalized = mb_strtolower($xmlName);

            if (isset($dbNormalized[$normalized])) {
                $matched[$hexId] = [
                    'xml_name' => $xmlName,
                    'db_id'    => $dbNormalized[$normalized]['db_id'],
                    'db_name'  => $dbNormalized[$normalized]['db_name'],
                ];
            } else {
                $unmatched[$hexId] = [
                    'xml_name' => $xmlName,
                ];
            }
        }

        return compact('matched', 'unmatched');
    }
}
