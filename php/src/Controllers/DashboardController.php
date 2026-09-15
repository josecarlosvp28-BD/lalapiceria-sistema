<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Json;
use App\Services\DashboardService;

final class DashboardController
{
    public function __construct(private DashboardService $dashboard = new DashboardService())
    {
    }

    public function resumenGeneral(): never
    {
        Json::ok($this->dashboard->resumenGeneral((string) $_GET['desde'], (string) $_GET['hasta']));
    }

    public function rotacionInventario(): never
    {
        Json::ok($this->dashboard->rotacionInventario((string) $_GET['desde'], (string) $_GET['hasta']));
    }

    public function clientesNuevosVsRecurrentes(): never
    {
        Json::ok($this->dashboard->clientesNuevosVsRecurrentes((string) $_GET['desde'], (string) $_GET['hasta']));
    }

    public function ingresosPorCanal(): never
    {
        Json::ok($this->dashboard->ingresosPorCanal((string) $_GET['desde'], (string) $_GET['hasta']));
    }
}
