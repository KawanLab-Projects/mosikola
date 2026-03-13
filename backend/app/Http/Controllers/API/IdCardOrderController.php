<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessIdCardZip;
use App\Models\IdCardTemplate;
use App\Models\IdCardOrder;
use App\Models\Student;
use App\Models\Transaction;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
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
            'zip_file'    => 'required|file|mimes:zip|max:102400', // 100MB max
            'template_id' => 'required|exists:id_card_templates,public_id',
        ]);

        /** @var \App\Models\User $user */
        $user       = auth()->user();
        $tenantUser = $user->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser && !$request->hasHeader('X-Tenant-Id'), 403, 'Akses ditolak.');
        $tenantId   = $request->header('X-Tenant-Id') ?? $tenantUser->tenant_id;

        // Save ZIP to local storage (worker will pick it up)
        $jobId    = (string) Str::uuid();
        $zipPath  = 'temp_zips/uploads/' . $jobId . '.zip';
        Storage::disk('local')->put($zipPath, file_get_contents($request->file('zip_file')->getPathname()));

        // Initialise the cache entry immediately so the frontend can start polling
        Cache::put('zip_job:' . $jobId, [
            'status'  => 'queued',
            'current' => 0,
            'total'   => 0,
        ], 1800);

        // Dispatch the background job
        ProcessIdCardZip::dispatch($jobId, (int) $tenantId, $zipPath);

        return response()->json(['job_id' => $jobId]);
    }

    public function zipJobStatus(string $jobId)
    {
        $data = Cache::get('zip_job:' . $jobId);

        if (!$data) {
            return response()->json(['status' => 'not_found'], 404);
        }

        return response()->json($data);
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

    /**
     * Initiate payment via Xendit for a pending IdCardOrder.
     * Creates a Transaction record, calls Xendit Invoice API and returns the invoice URL.
     */
    public function initiatePayment(Request $request, $id)
    {
        $order = IdCardOrder::with(['tenant', 'template'])->where('id', $id)->firstOrFail();

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order tidak dalam status pending'], 400);
        }

        /** @var \App\Models\User $user */
        $user = auth()->user();
        $tenantUser = $user->tenantUsers()->where('is_active', true)->first();
        abort_if(!$tenantUser, 403, 'Akses ditolak.');

        // Prevent duplicate payment initiations (idempotency)
        $existingTx = $order->transactions()->where('status', 'PENDING')->first();
        if ($existingTx) {
            return response()->json([
                'invoice_url'    => $existingTx->xendit_invoice_url,
                'transaction_id' => $existingTx->id,
                'reference_id'   => $existingTx->reference_id,
            ]);
        }

        $referenceId = 'KARTU-' . strtoupper($id) . '-' . strtoupper(Str::random(6));

        // Create the transaction record first (PENDING)
        $transaction = Transaction::create([
            'tenant_id'    => $order->tenant_id,
            'reference_id' => $referenceId,
            'payable_type' => IdCardOrder::class,
            'payable_id'   => $order->id,
            'amount'       => $order->total_price,
            'status'       => 'PENDING',
        ]);

        $invoiceUrl = null;
        $xenditInvoiceId = null;

        // Only call Xendit if a secret key is configured (skip in local mock mode)
        if (config('services.xendit.secret_key')) {
            try {
                $xenditService = app(XenditService::class);
                $invoice = $xenditService->createInvoice([
                    'external_id' => $referenceId,
                    'amount'      => (int) $order->total_price,
                    'description' => 'Pembayaran Kartu Siswa – Order ' . $order->id,
                    'payer_email' => $user->email,
                    'success_redirect_url' => config('app.frontend_url', config('app.url')) . '/dashboard/kartu-siswa?status=success',
                    'failure_redirect_url' => config('app.frontend_url', config('app.url')) . '/dashboard/kartu-siswa?status=failed',
                ]);

                $invoiceUrl      = $invoice['invoice_url'] ?? null;
                $xenditInvoiceId = $invoice['id'] ?? null;
            } catch (\Throwable $e) {
                // Rollback the transaction record and surface the error
                $transaction->delete();
                return response()->json(['message' => $e->getMessage()], 502);
            }
        }

        // Persist the Xendit invoice details
        $transaction->xendit_invoice_url = $invoiceUrl;
        $transaction->xendit_invoice_id  = $xenditInvoiceId;
        $transaction->save();

        return response()->json([
            'invoice_url'    => $invoiceUrl,
            'transaction_id' => $transaction->id,
            'reference_id'   => $referenceId,
        ], 201);
    }

    /**
     * DEVELOPMENT ONLY — mock payment for local testing without hitting Xendit.
     * Guarded to APP_ENV=local.
     */
    public function payMock(Request $request, $id)
    {
        abort_unless(app()->isLocal(), 403, 'Mock payments are only allowed in local environment.');

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
