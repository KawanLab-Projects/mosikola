# AI Rules — Mosikola (Absensee)

Dokumen ini adalah panduan arsitektur dan konvensi kode untuk project Mosikola.
Semua kontribusi kode (human maupun AI) wajib mengikuti aturan ini.

---

## BACKEND (Laravel)

### Pola Arsitektur: Controller → Service → Repository

Setiap domain menggunakan tiga layer dengan tanggung jawab yang ketat:

| Layer | Tanggung Jawab | Larangan |
|---|---|---|
| **Controller** | Menerima request, memanggil Service, mengembalikan response JSON | Tidak boleh ada logika bisnis atau query database langsung |
| **Service** | Memproses seluruh logika bisnis dan orkestrasi antar Repository | Tidak boleh langsung memanggil Model Eloquent untuk query |
| **Repository** | Abstraksi akses database via Eloquent | Tidak boleh ada logika bisnis |

### Aturan Controller

- Injeksi Service via constructor (constructor injection), bukan `new Service()`
- Selalu kembalikan `response()->json([...])` dengan struktur konsisten
- Input validasi ringan boleh di Controller, validasi bisnis ada di Service
- Tidak ada `if/else` logika bisnis di Controller

```php
// ✅ Benar
class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $attendanceService) {}

    public function record(Request $request)
    {
        $result = $this->attendanceService->recordAttendance($request->user(), $request->token);
        return response()->json(['data' => $result]);
    }
}

// ❌ Salah — ada logika bisnis di Controller
public function record(Request $request)
{
    $student = Student::where('user_id', $request->user()->id)->first();
    if (Attendance::where(...)->exists()) { ... }
}
```

### Aturan Service

- Hanya mengandalkan Repository untuk akses data, tidak boleh query Eloquent langsung
- Gunakan PHP `enum` untuk hasil/state yang terdefinisi (bukan string magic)
- Boleh memanggil beberapa Repository jika diperlukan

```php
// ✅ Gunakan enum untuk hasil yang terdefinisi
enum AttendanceResult: string
{
    case ALREADY_ATTENDED = 'already_attended';
    case ATTENDANCE_RECORDED = 'attendance_recorded';
    case INVALID_TOKEN = 'token_is_invalid';
}
```

### Aturan Repository

- Setiap Repository **wajib** memiliki Interface (Contract) di file yang sama
- Nama interface: `{DomainName}RepoInterface`
- Method harus type-hinted dengan return type yang eksplisit

```php
// ✅ Interface wajib ada di file Repository
interface AttendanceRepoInterface
{
    public function create(int $student_id): Attendance;
    public function checkAttendance(Student $student): bool;
}

class AttendanceRepository implements AttendanceRepoInterface { ... }
```

### Aturan Model

- Selalu definisikan `$fillable` — tidak boleh menggunakan `$guarded = []`
- Gunakan `$casts` untuk field boolean, decimal, dan date
- Relasi menggunakan method yang mengembalikan Builder (bukan query langsung)
- Gunakan `public_id` (UUID/string) sebagai identifier yang diekspos ke luar

```php
// ✅ Benar
protected $fillable = ['name', 'is_active'];
protected $casts = ['is_active' => 'boolean', 'price' => 'decimal:2'];
```

### Aturan Migration

- Setiap foreign key wajib menggunakan `->constrained()->cascadeOnDelete()`
- Semua tabel wajib memiliki `$table->timestamps()`
- Urutan kolom: `id` → `foreign keys` → field domain → `timestamps`

### Response Format

Gunakan struktur yang konsisten untuk semua endpoint:

```json
// Koleksi data
{ "data": [...], "meta": { "total_data": 10 } }

// Single resource
{ "data": { ... } }

// Error
{ "message": "...", "errors": { ... } }
```

---

## FRONTEND (Next.js + TypeScript)

### Pola Arsitektur

| Tool | Peran | Lokasi |
|---|---|---|
| **TanStack Query** | Fetching, caching, refetch, error state dari API | Hook di `hooks/` |
| **Zustand** | Global UI state, session/auth state | Store di `stores/` |
| **axios (`lib/api.ts`)** | HTTP client dengan interceptor Bearer token | `lib/api.ts` |
| **TypeScript types** | Semua interface/type domain | `types/index.ts` |

### Aturan Komponen

- Komponen **hanya** bertanggung jawab atas rendering dan event handler
- **Dilarang** memanggil `api.*` atau `fetch()` langsung di dalam komponen
- **Dilarang** menaruh logika bisnis atau transformasi data di dalam komponen
- Gunakan prop typing yang eksplisit — tidak boleh ada `props: any`

```tsx
// ✅ Benar — komponen hanya render dan delegasi
type LoginFormProps = {
    onSubmit: (data: { user: string; password: string }) => void;
    isLoading?: boolean;
} & Omit<React.ComponentProps<'div'>, 'onSubmit'>;

export function LoginForm({ onSubmit, isLoading = false, ...props }: LoginFormProps) { ... }

// ❌ Salah — ada fetch langsung di komponen
export function LoginForm() {
    const handleSubmit = async () => {
        const res = await axios.post('/api/login', data); // DILARANG
    }
}
```

### Aturan TanStack Query

- Semua data fetching wajib menggunakan `useQuery` atau `useMutation`
- Query key harus deskriptif dan unik per domain: `['students', id]`
- Error dan loading state harus selalu di-handle

```tsx
// ✅ Benar
const { data, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(r => r.data),
})
```

### Aturan TypeScript

- Semua interface domain type didefinisikan di `types/index.ts`
- Gunakan pola `Input` type untuk payload create/update: `Omit<Entity, 'public_id' | 'created_at' | 'updated_at'>`
- Tidak boleh ada `any` — gunakan `unknown` jika tipe tidak diketahui
- Semua field yang diekspos dari backend menggunakan `public_id: string` sebagai identifier

```ts
// ✅ Pola yang digunakan
export interface Student { public_id: string; name: string; ... }
export type StudentInput = Omit<Student, 'public_id' | 'created_at' | 'updated_at' | 'classroom'>;
```

### Aturan API Client (`lib/api.ts`)

- Gunakan instance `api` dari `lib/api.ts` — **jangan** buat axios instance baru
- Token Bearer otomatis ditambahkan via interceptor — tidak perlu set manual di komponen
- Base URL dikontrol via `NEXT_PUBLIC_API_URL` environment variable

### Struktur Folder Frontend

```
app/
  components/      # Shared UI components (pure, no data fetching)
  dashboard/       # Route pages untuk dashboard
  auth/            # Route pages untuk autentikasi
hooks/             # Custom hooks (TanStack Query hooks)
stores/            # Zustand stores
types/             # TypeScript interfaces & types
lib/
  api.ts           # Axios instance
  utils.ts         # Utility functions
```

---

## KONVENSI UMUM

### Naming Convention

| Konteks | Konvensi | Contoh |
|---|---|---|
| PHP Class | PascalCase | `AttendanceService` |
| PHP Method | camelCase | `recordAttendance()` |
| DB Column | snake_case | `student_id`, `attended_at` |
| TS Interface | PascalCase | `StudyProgram` |
| TS Type alias | PascalCase | `StudentInput` |
| React Component | PascalCase | `LoginForm` |
| React Hook | camelCase dengan prefix `use` | `useStudents()` |
| Zustand Store | camelCase dengan suffix `Store` | `useAuthStore` |

### Database

- Identifier internal: `id` (auto-increment integer, tidak diekspos ke frontend)
- Identifier publik: `public_id` (UUID atau string unik, diekspos via API)
- Semua timestamp menggunakan `created_at` / `updated_at` dari `timestamps()`
- Foreign key mengikuti konvensi: `{table_singular}_id` (contoh: `tenant_id`)

### Environment

- Backend env: `.env` (Laravel standard)
- Frontend env: `.env.local` — prefix `NEXT_PUBLIC_` untuk client-side vars
- Tidak boleh ada hardcoded URL atau secret di dalam kode