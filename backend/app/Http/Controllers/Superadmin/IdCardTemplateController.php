<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\IdCardTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IdCardTemplateController extends Controller
{
    public function index()
    {
        return response()->json(IdCardTemplate::all());
    }

    public function show($id)
    {
        $template = IdCardTemplate::where('public_id', $id)->firstOrFail();
        return response()->json($template);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'background_image' => 'nullable|image|max:2048', // max 2MB
            'back_background_image' => 'nullable|image|max:2048',
        ]);

        $template = new IdCardTemplate();
        $template->public_id = Str::uuid()->toString();
        $template->name = $validated['name'];
        $template->price = $validated['price'];

        // Setup initial default canvas state
        $template->canvas_state = [
            'photo' => ['x' => 50, 'y' => 50, 'width' => 100, 'height' => 120, 'visible' => true],
            'name' => ['x' => 200, 'y' => 50, 'fontSize' => 20, 'fontFamily' => 'Arial', 'color' => '#000000', 'visible' => true],
            'nisn' => ['x' => 200, 'y' => 80, 'fontSize' => 16, 'fontFamily' => 'Arial', 'color' => '#333333', 'visible' => true],
            'birth_info' => ['x' => 200, 'y' => 110, 'fontSize' => 14, 'fontFamily' => 'Arial', 'color' => '#333333', 'visible' => true],
            'address' => ['x' => 200, 'y' => 140, 'fontSize' => 14, 'fontFamily' => 'Arial', 'color' => '#333333', 'visible' => true],
            'qr_code' => ['x' => 300, 'y' => 200, 'width' => 80, 'height' => 80, 'visible' => true],
        ];

        if ($request->hasFile('background_image')) {
            $path = $request->file('background_image')->store('id-card-templates', 's3');
            if ($path) $template->background_path = $path;
        }

        if ($request->hasFile('back_background_image')) {
            $path = $request->file('back_background_image')->store('id-card-templates', 's3');
            if ($path) $template->back_background_path = $path;
        }

        $template->save();

        return response()->json($template, 201);
    }

    public function update(Request $request, $id)
    {
        $template = IdCardTemplate::where('public_id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'price' => 'sometimes|integer|min:0',
            'canvas_state' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
            'requires_transparent_photo' => 'sometimes|boolean',
            'background_image' => 'nullable|image|max:2048',
            'back_background_image' => 'nullable|image|max:2048',
            'thumbnail_image' => 'nullable|image|max:2048',
        ]);

        if (isset($validated['name'])) $template->name = $validated['name'];
        if (isset($validated['price'])) $template->price = $validated['price'];
        if (isset($validated['canvas_state'])) $template->canvas_state = $validated['canvas_state'];
        if (isset($validated['is_active'])) $template->is_active = $validated['is_active'];
        if (isset($validated['requires_transparent_photo'])) $template->requires_transparent_photo = $validated['requires_transparent_photo'];

        if ($request->hasFile('background_image')) {
            $path = $request->file('background_image')->store('id-card-templates', 's3');
            if ($path) {
                if ($template->background_path) {
                    Storage::disk('s3')->delete($template->background_path);
                }
                $template->background_path = $path;
            }
        }

        if ($request->hasFile('back_background_image')) {
            $path = $request->file('back_background_image')->store('id-card-templates', 's3');
            if ($path) {
                if ($template->back_background_path) {
                    Storage::disk('s3')->delete($template->back_background_path);
                }
                $template->back_background_path = $path;
            }
        }

        if ($request->hasFile('thumbnail_image')) {
            $path = $request->file('thumbnail_image')->store('id-card-templates/thumbnails', 's3');
            if ($path) {
                if ($template->thumbnail_path) {
                    Storage::disk('s3')->delete($template->thumbnail_path);
                }
                $template->thumbnail_path = $path;
            }
        }

        $template->save();

        return response()->json($template);
    }

    public function destroy($id)
    {
        $template = IdCardTemplate::where('public_id', $id)->firstOrFail();

        // Optional: Ensure template has no orders before deleting, or soft-delete instead, but since we cascade constraints, let's keep it simple.
        if ($template->background_path) {
            Storage::disk('s3')->delete($template->background_path);
        }

        if ($template->back_background_path) {
            Storage::disk('s3')->delete($template->back_background_path);
        }

        $template->delete();

        return response()->json(['message' => 'Template deleted successfully']);
    }
}
