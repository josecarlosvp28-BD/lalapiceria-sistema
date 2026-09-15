# La Lapicería — Backend PHP

Backend PHP 8.2+ / MySQL para el Sistema de Gestión de La Lapicería,
migrado desde la versión Node.js/Express. Ver `../MIGRATION_AUDIT.md` para
el detalle completo de la migración.

## Estructura

```
php/
  public/           <- raíz pública (document root) en el hosting
    index.php       <- front controller: enruta todas las peticiones /api/*
    .htaccess       <- reglas de reescritura (API vs. frontend estático)
  src/
    Config/         <- conexión a la base de datos
    Controllers/    <- glue HTTP: lee la petición, llama al Service, responde JSON
    Services/       <- lógica de negocio (validaciones, reglas), sin SQL
    Repositories/   <- único lugar con SQL (PDO preparado)
    Http/           <- helpers de sesión y respuestas JSON
  bin/
    seed-admin.php  <- crea el usuario administrador inicial (una sola vez)
  cron/
    backup.php      <- respaldo de la base de datos (para Cron Job de Hostinger)
  tests/            <- PHPUnit
  schema.sql        <- DDL completo de MySQL
  composer.json
  .env.example
```

## Desarrollo local

Necesitas PHP 8.2+, Composer, y una base de datos MySQL local.

```bash
composer install
cp .env.example .env   # y completa los datos de tu MySQL local
mysql -u root -p < schema.sql   # (crea antes la base de datos vacía)
php bin/seed-admin.php          # crea el usuario administrador — guarda la contraseña que imprime
```

Para probar solo la API (con curl, Postman, etc.), basta con:
```bash
php -S localhost:8000 public/index.php
```

Para ver la aplicación completa (frontend + API) en el navegador, compila el
frontend una vez y sirve todo junto con el enrutador de desarrollo
(`router-dev.php` replica las reglas de `.htaccess`, que el servidor
integrado de PHP no lee por sí solo):
```bash
cd ..            # raíz del proyecto
npm run build
cp -R dist/* php/public/
cd php
php -S localhost:8000 public/router-dev.php
```
Y en otra terminal, si quieres además hot-reload de React mientras editas:
```bash
npm run dev   # sirve en :5173 y reenvía /api a :8000 (ver vite.config.ts)
```

Corre las pruebas con:

```bash
composer test
```

Las pruebas usan la misma base de datos configurada en `.env` — apunta
`DB_NAME` a una base de pruebas (p. ej. `lalapiceria_test`), nunca a la de
producción, ya que cada prueba vacía todas las tablas antes de correr.

## Desplegar en Hostinger (con acceso SSH)

1. **Crear la base de datos MySQL** desde hPanel → Bases de datos → Bases de
   datos MySQL. Anota el host, nombre, usuario y contraseña.

2. **Subir el código por SSH** (reemplaza `usuario` y `dominio` por los tuyos):
   ```bash
   ssh usuario@dominio -p 65002
   cd domains/tudominio.com/
   git clone https://github.com/josecarlosvp28-BD/lalapiceria-sistema.git app
   cd app/php
   composer install --no-dev --optimize-autoloader
   ```

3. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   nano .env   # completa DB_HOST, DB_NAME, DB_USER, DB_PASS, SESSION_SECRET (una cadena larga y aleatoria)
   ```

4. **Importar el esquema:**
   ```bash
   mysql -h TU_DB_HOST -u TU_DB_USER -p TU_DB_NAME < schema.sql
   ```

5. **Crear el usuario administrador** (guarda la contraseña que te muestra, no se repite):
   ```bash
   php bin/seed-admin.php
   ```

6. **Apuntar el dominio a `php/public/`** como document root (hPanel →
   Dominios → Editar → carpeta raíz), para que `index.php` y `.htaccess`
   queden en la raíz servida.

7. **Compilar y copiar el frontend** (desde tu máquina, en la raíz del
   proyecto — no en `php/`):
   ```bash
   npm run build
   scp -P 65002 -r dist/* usuario@dominio:domains/tudominio.com/app/php/public/
   ```

8. **Configurar el Cron Job de respaldo** (hPanel → Avanzado → Cron Jobs):
   - Comando: `php /home/usuario/domains/tudominio.com/app/php/cron/backup.php`
   - Frecuencia sugerida: cada 6 horas

9. **Probar:** visita tu dominio, deberías ver la pantalla de inicio de
   sesión. Entra con el correo y contraseña que imprimió `seed-admin.php`.

## Volver a desplegar tras un cambio de código

```bash
ssh usuario@dominio -p 65002
cd domains/tudominio.com/app
git pull
cd php && composer install --no-dev --optimize-autoloader
```

Y si cambió el frontend, repite el paso 7 (compilar y copiar `dist/`).
