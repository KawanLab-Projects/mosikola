<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'user' => 'required',
            'password' => 'required',
        ]);

        $login_type = filter_var($request->input('user'), FILTER_VALIDATE_EMAIL)
            ? 'email'
            : 'name';

        $user = User::where($login_type, $request->input('user'))->first();


        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'status' => false,
                'message' => "Username or Password invalid"
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $userData = [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->getRoleNames()
        ];

        // Attach school_type so the frontend can adapt menus per school level
        $tenantUser = $user->tenantUsers()->where('is_active', true)->with('tenant')->first();
        if ($tenantUser) {
            $userData['school_type'] = $tenantUser->tenant->school_type;
        }

        if ($user->hasRole('student')) {
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            if ($student) {
                $userData['display_name'] = $student->name;
            }
        }

        return response()->json([
            'status'  => true,
            'message' => 'Login Success',
            'token'   => $token,
            'user'    => $userData,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logged Out'
        ]);
    }

    public function verifyToken(Request $request)
    {
        $user = $request->user()->currentAccessToken();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid Token'
            ], 401);
        }

        return response()->json([
            'status' => true,
            'message' => 'Valid Token'
        ]);
    }
}
