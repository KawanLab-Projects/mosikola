export interface StudyProgram {
    public_id: string;
    name: string;
    short: string;
    created_at?: string;
    updated_at?: string;
}

export type StudyProgramInput = Omit<StudyProgram, 'public_id' | 'created_at' | 'updated_at'>;

export interface Classroom {
    public_id: string;
    name: string;
    short: string;
    grade_level?: number;
    study_program?: StudyProgram;
    homeroom_assignment?: { teacher?: Teacher };
    created_at?: string;
    updated_at?: string;
}

export type ClassroomInput = Omit<Classroom, 'public_id' | 'created_at' | 'updated_at' | 'study_program'>;

export interface Student {
    public_id: string;
    name: string;
    nisn: string;
    nfc_uid?: string;
    email?: string;
    birth_place?: string;
    birth_date: string;
    address: string;
    parent_phone: string;
    parent_name: string;
    status: 'active' | 'archived';
    classroom?: Classroom;
}

export interface StudentInput {
    name: string;
    nisn: string;
    email?: string;
    birth_place?: string;
    birth_date: string;
    address: string;
    parent_phone: string;
    parent_name: string;
}

export interface AcademicYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_schedule_locked?: boolean;
}

export interface TeacherAssignment {
    id: number;
    teacher_id: number;
    classroom_id: number;
    academic_year_id: number;
    assignment_type: 'wali_kelas' | 'guru_bk' | 'guru_mapel' | 'guru_wali';
    subject?: string | null;
    classroom?: Classroom;
    academic_year?: AcademicYear;
    created_at?: string;
    updated_at?: string;
}

export interface Teacher {
    public_id: string;
    name: string;
    nip: string;
    email: string | null;
    has_user: boolean;
    assignments?: TeacherAssignment[];
    created_at?: string;
    updated_at?: string;
}

export type TeacherInput = {
    name: string;
    nip: string;
};

export interface Subject {
    public_id: string;
    name: string;
    code?: string;
    created_at?: string;
    updated_at?: string;
}

export type SubjectInput = { name: string; code?: string };
