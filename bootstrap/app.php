<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\Cors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(Cors::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // kalau mau custom error handling taruh di sini
        // contoh:
        // $exceptions->render(function (\Throwable $e) {
        //     return response()->json(['error' => $e->getMessage()], 500);
        // });
    })
    ->create();
