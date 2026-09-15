<?php

declare(strict_types=1);

namespace App;

final class Router
{
    /** @var array<int, array{method: string, pattern: string, regex: string, params: string[], handler: callable, auth: bool}> */
    private array $routes = [];

    public function get(string $path, callable $handler, bool $auth = true): void
    {
        $this->add('GET', $path, $handler, $auth);
    }

    public function post(string $path, callable $handler, bool $auth = true): void
    {
        $this->add('POST', $path, $handler, $auth);
    }

    public function put(string $path, callable $handler, bool $auth = true): void
    {
        $this->add('PUT', $path, $handler, $auth);
    }

    public function delete(string $path, callable $handler, bool $auth = true): void
    {
        $this->add('DELETE', $path, $handler, $auth);
    }

    private function add(string $method, string $path, callable $handler, bool $auth): void
    {
        $params = [];
        $regex = preg_replace_callback('/\{(\w+)\}/', function ($m) use (&$params) {
            $params[] = $m[1];
            return '([^/]+)';
        }, $path);

        $this->routes[] = [
            'method' => $method,
            'pattern' => $path,
            'regex' => '#^' . $regex . '$#',
            'params' => $params,
            'handler' => $handler,
            'auth' => $auth,
        ];
    }

    /**
     * @return array{matched: bool, auth?: bool, handler?: callable, params?: array<string, string>}
     */
    public function match(string $method, string $path): array
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            if (preg_match($route['regex'], $path, $matches)) {
                array_shift($matches);
                $params = array_combine($route['params'], $matches) ?: [];
                return [
                    'matched' => true,
                    'auth' => $route['auth'],
                    'handler' => $route['handler'],
                    'params' => $params,
                ];
            }
        }

        return ['matched' => false];
    }
}
