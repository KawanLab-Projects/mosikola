<?php

namespace App\Providers;

use App\Repositories\Contracts\StudyProgramRepoInterface;
use App\Repositories\Contracts\TenantRegistrationRepoInterface;
use App\Repositories\StudyProgramRepository;
use App\Repositories\TenantRegistrationRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            StudyProgramRepoInterface::class,
            StudyProgramRepository::class,
        );

        $this->app->bind(
            TenantRegistrationRepoInterface::class,
            TenantRegistrationRepository::class,
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
