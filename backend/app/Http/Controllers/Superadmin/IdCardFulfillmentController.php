<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\IdCardOrder;
use Illuminate\Http\Request;

class IdCardFulfillmentController extends Controller
{
    public function index()
    {
        $orders = IdCardOrder::with(['tenant', 'template'])
            ->withCount('items')
            ->latest()
            ->get();

        return response()->json($orders);
    }

    public function update(Request $request, $id)
    {
        $order = IdCardOrder::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,paid,on_progress,shipping,completed',
            'shipping_receipt_number' => 'sometimes|string|nullable'
        ]);

        if (array_key_exists('status', $validated)) {
            $order->status = $validated['status'];
        }

        if (array_key_exists('shipping_receipt_number', $validated)) {
            $order->shipping_receipt_number = $validated['shipping_receipt_number'];
        }

        $order->save();

        return response()->json($order);
    }

    public function downloadAssets($id)
    {
        $order = IdCardOrder::with('items.student')->findOrFail($id);

        // In a full production setup, this would either:
        // 1. Generate PDFs on the fly using `dompdf` mapped to the canvas_state
        // 2. Return a JSON structure for the frontend to render onto an HTML5 canvas and export as PNGs.
        // For MVP, we return the structured data.

        return response()->json([
            'message' => 'Asset generation ready. Frontend can construct the images using this data.',
            'order' => $order
        ]);
    }
}
