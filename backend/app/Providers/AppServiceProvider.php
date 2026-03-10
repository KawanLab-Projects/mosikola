<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Repositories\Contracts\TenantRegistrationRepoInterface::class,
            \App\Repositories\TenantRegistrationRepository::class,
        );

        $this->app->bind(
            \App\Repositories\Contracts\UserRepoInterface::class,
            \App\Repositories\UserRepository::class,
        );

        $this->app->bind(
            \App\Repositories\Contracts\TenantRepoInterface::class,
            \App\Repositories\TenantRepository::class,
        );

        $this->app->bind(
            \App\Repositories\Contracts\TenantUserRepoInterface::class,
            \App\Repositories\TenantUserRepository::class,
        );

        $this->app->bind(
            \App\Repositories\Contracts\SubscriptionRepoInterface::class,
            \App\Repositories\SubscriptionRepository::class,
        );

        $this->app->bind(
            \App\Repositories\Contracts\PlanRepoInterface::class,
            \App\Repositories\PlanRepository::class,
        );

        $this->app->bind(
            \App\Repositories\Contracts\AcademicYearRepoInterface::class,
            \App\Repositories\AcademicYearRepository::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
