<?php

namespace App\Http\Controllers;

use App\Services\BkDashboardService;
use Illuminate\Http\Request;

class BkDashboardController extends Controller
{
    protected $service;

    public function __construct(BkDashboardService $service)
    {
        $this->service = $service;
    }

    public function getStats(Request $request)
    {
        $stats = $this->service->getStats($request->user());

        return response()->json($stats);
    }

    public function getNeedsAttention(Request $request)
    {
        $limit = $request->query('limit', 10);
        $students = $this->service->getNeedsAttention($request->user(), $limit);

        return response()->json(['data' => $students]);
    }
}
