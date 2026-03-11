<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\IdCardTemplate;
use App\Models\IdCardOrder;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use ZipArchive;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class IdCardOrderController extends Controller
{
    // List templates for Admin to purchase
    public function templates()
    {
        return response()->json(IdCardTemplate::where('is_active', true)->get());
    }

    // Superadmin: List all orders
    public function indexAll()
    {
        $orders = IdCardOrder::with(['template', 'tenant', 'creator'])
            ->withCount('items')
            ->latest()
            ->get();

        return response()->json($orders);
    }

    // Superadmin: Update status or resi
    public function updateStatus(Request $request, $id)
    {
        $order = IdCardOrder::findOrFail($id);

        if ($request->has('status')) {
            $order->status = $request->status;
        }

        if ($request->has('shipping_receipt_number')) {
            $order->shipping_receipt_number = $request->shipping_receipt_number;
        }

        $order->save();
        return response()->json($order);
    }

    // List school's own orders
    public function myOrders(Request $request)
    {
        $tenantId = $request->header('X-Tenant-Id');

        // If header not strictly enforced globally, default to user's tenant
        if (!$tenantId && Auth::check()) {
            $user = Auth::user();
            $tenantUser = $user->tenantUsers()->where('is_active', true)->first();
            if ($tenantUser) $tenantId = $tenantUser->tenant_id;
        }

        $orders = IdCardOrder::with(['template', 'creator'])
            ->withCount('items')
            ->where('tenant_id', $tenantId)
            ->latest()
            ->get();

        return response()->json($orders);
    }

    public function previewZip(Request $request)
    {
        $request->validate([
            'zip_file' => 'required|file|mimes:zip|max:51200', // 50MB max
            'template_id' => 'required|exists:id_card_templates,public_id'
        ]);

        /** @var \App\Models\User $user */
        $user = auth()->user();
        $tenantUser = $user->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser && !$request->hasHeader('X-Tenant-Id'), 403, 'Akses ditolak.');
        $tenantId = $request->header('X-Tenant-Id') ?? $tenantUser->tenant_id;
        $file = $request->file('zip_file');

        $zip = new ZipArchive();
        $res = $zip->open($file->getPathname());

        if ($res !== TRUE) {
            return response()->json(['message' => 'Failed to open ZIP file'], 400);
        }

        $tmpDir = 'temp_zips/' . Str::random(10);
        $extractPath = Storage::disk('local')->path($tmpDir);
        Storage::disk('local')->makeDirectory($tmpDir);
        $zip->extractTo($extractPath);
        $zip->close();

        // Scan extracted files
        $valid = [];
        $invalid = [];

        $files = File::allFiles($extractPath);
        foreach ($files as $f) {
            $filename = $f->getFilename();
            $nisn = pathinfo($filename, PATHINFO_FILENAME);
            $ext = strtolower($f->getExtension());

            if (!in_array($ext, ['jpg', 'jpeg', 'png'])) continue;

            // Find student
            $student = Student::where('tenant_id', $tenantId)->where('nisn', $nisn)->first();

            if ($student) {
                // Move file to permanent location on R2 (s3 disk)
                $newPath = 'student_photos/' . $tenantId . '/' . Str::random(15) . '.' . $ext;
                // Read from local tmp, write to s3
                Storage::disk('s3')->put($newPath, file_get_contents($f->getPathname()));

                $valid[] = [
                    'student' => $student,
                    'photo_url' => Storage::disk('s3')->url($newPath),
                    'photo_path' => $newPath
                ];
            } else {
                $invalid[] = $filename;
            }
        }

        // Cleanup temporary extraction folder
        Storage::disk('local')->deleteDirectory($tmpDir);

        return response()->json([
            'valid' => $valid,
            'invalid' => $invalid
        ]);
    }

    public function show($id)
    {
        $order = IdCardOrder::with(['template', 'tenant', 'creator'])
            ->withCount('items')
            ->where('id', $id)
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:id_card_templates,public_id',
            'shipping_info' => 'required|array',
            'payment_method' => 'required|string',
            'valid_items' => 'required|array',
            'card_type' => 'required|in:regular,rfid',
        ]);

        /** @var \App\Models\User $user */
        $user = auth()->user();
        $tenantUser = $user->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser && !$request->hasHeader('X-Tenant-Id'), 403, 'Akses ditolak.');
        $tenantId = $request->header('X-Tenant-Id') ?? $tenantUser->tenant_id;

        // Prevent duplicate clicks
        $lock = \Illuminate\Support\Facades\Cache::lock('order-card-' . $tenantId . '-' . $user->id, 5);
        if (!$lock->get()) {
            return response()->json(['message' => 'Pesanan sedang diproses. Jangan klik terlalu cepat.'], 429);
        }

        $template = IdCardTemplate::where('public_id', $validated['template_id'])->firstOrFail();

        $qty = count($validated['valid_items']);

        $unitPrice = $template->price;
        if ($validated['card_type'] === 'regular') {
            $unitPrice = $unitPrice * 0.8; // 20% discount for regular
        }

        $totalPrice = $qty * $unitPrice;

        try {
            $order = new IdCardOrder();
            $order->id = 'ORD-KARTU-' . strtoupper(Str::random(8));
            $order->tenant_id = $tenantId;
            $order->template_id = $template->id;
            $order->card_type = $validated['card_type'];
            $order->total_price = $totalPrice;
            $order->shipping_info = $validated['shipping_info'];
            $order->payment_method = $validated['payment_method'];
            $order->status = 'pending';
            $order->created_by = $user->id;
            $order->save();

            foreach ($validated['valid_items'] as $item) {
                $studentData = $item['student'];
                $student = Student::where('public_id', $studentData['public_id'])->firstOrFail();

                $order->items()->create([
                    'student_id' => $student->id, // Get the real internal ID here
                    'photo_path' => $item['photo_path'],
                    'print_snapshot' => [
                        'name' => $student->name,
                        'nisn' => $student->nisn,
                        'birth_place' => $student->birth_place ?? '',
                        'birth_date' => $student->birth_date ?? ''
                    ]
                ]);
            }

            // load items to return complete structure
            $order->load('items');

            return response()->json([
                'id' => $order->id,
                'status' => $order->status,
                'total_qty' => $qty,
                'total_price' => $order->total_price,
                'payment_method' => $order->payment_method
            ], 201);
        } finally {
            $lock->release();
        }
    }

    public function payMock(Request $request, $id)
    {
        $order = IdCardOrder::where('id', $id)->firstOrFail();

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order is not pending payment'], 400);
        }

        $order->status = 'paid';
        $order->save();

        return response()->json($order);
    }
    public function updateNfcUid(Request $request, $id, $studentPublicId)
    {
        $request->validate([
            'nfc_uid' => 'required|string|max:255'
        ]);

        $order = IdCardOrder::findOrFail($id);

        $student = Student::where('public_id', $studentPublicId)->firstOrFail();

        // Verify student is in this order for security
        $order->items()->where('student_id', $student->id)->firstOrFail();

        $student->nfc_uid = $request->nfc_uid;
        $student->save();

        return response()->json(['message' => 'NFC UID berhasil disimpan', 'student' => $student]);
    }

    public function downloadData(Request $request, $id)
    {
        // This endpoint will be called by Superadmin to get full payload for client-side rendering
        $order = IdCardOrder::with(['template', 'tenant'])->where('id', $id)->firstOrFail();

        // Load items with the student relations
        $order->load(['items.student']);

        // Load the school tenant settings (name, address, headmaster details, logo)
        $tenantSettings = \App\Models\TenantSetting::where('tenant_id', $order->tenant_id)
            ->where('group', 'school')
            ->get()
            ->keyBy('key')
            ->map(fn($s) => $s->value);

        $logoUrl = null;
        if (!empty($tenantSettings['school_logo_url'])) {
            $logoPath = $tenantSettings['school_logo_url'];
            if (str_starts_with($logoPath, 'storage/')) {
                $logoUrl = asset($logoPath);
            } else {
                $logoUrl = \Illuminate\Support\Facades\Storage::disk('s3')->url($logoPath);
            }
        }

        return response()->json([
            'order' => $order,
            'schoolData' => [
                'name' => $tenantSettings['school_name'] ?? $order->tenant->name,
                'address' => $tenantSettings['school_address'] ?? 'Alamat Belum Diatur',
                'principal_name' => $tenantSettings['principal_name'] ?? 'Nama Kepala Sekolah',
                'principal_nip' => $tenantSettings['principal_nip'] ?? '-',
                'logo_url' => $logoUrl
            ]
        ]);
    }
}
