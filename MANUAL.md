# La Lapicería — Manual del sistema (para el dueño del negocio)

## Cómo abrir el sistema

Entra a la dirección web que te dé Hostinger (tu dominio, por ejemplo
`https://sistema.lalapiceria.com`) desde cualquier navegador — computadora,
celular o tablet, siempre que tengas internet. Inicia sesión con tu correo y
contraseña.

## Cómo cambiar tu contraseña

Por ahora, cambiar contraseñas se hace desde la base de datos directamente
(no hay una pantalla en la app todavía para esto). Si necesitas cambiarla,
pide ayuda para correr este comando por SSH en el servidor:
```bash
php bin/seed-admin.php
```
Esto solo funciona si no hay ningún usuario creado todavía. Para cambiar la
contraseña de un usuario existente, se necesita un ajuste directo en
phpMyAdmin (hPanel → Bases de datos → phpMyAdmin) sobre la tabla `usuarios`.

## Cómo agregar un nuevo usuario (vendedor, taller de grabado, etc.)

Todavía no hay una pantalla en la app para esto — se agrega por la API o
directamente en la base de datos. Es una de las primeras mejoras a considerar
si el negocio crece a varios vendedores.

## Cómo se respalda la información

La base de datos se respalda automáticamente cada 6 horas mediante un Cron
Job configurado en Hostinger (hPanel → Avanzado → Cron Jobs). Los respaldos
quedan guardados en el servidor, en la carpeta indicada en `BACKUP_DIR`
dentro del archivo `.env`. Se conservan los últimos 30 respaldos.

**Recomendación:** descarga una copia de los respaldos a tu computadora de
vez en cuando (por ejemplo, una vez al mes) usando el Administrador de
Archivos de hPanel o FileZilla, como seguro adicional.

## Qué hacer si algo se ve mal o no carga

1. Revisa que tu conexión a internet funcione.
2. Prueba recargar la página (Cmd+R o F5).
3. Si sigue sin funcionar, revisa los "Error Logs" en hPanel → Avanzado →
   Registro de errores de PHP — ahí aparece el detalle técnico del problema.
4. Contacta a quien te ayudó con el desarrollo, compartiendo lo que viste en
   pantalla y, si puedes, el mensaje del registro de errores.

## Cómo se actualiza el sistema cuando hay cambios de código

Esto lo hace quien mantiene el sistema técnicamente. Los pasos técnicos
completos están en [`php/README.md`](php/README.md), sección "Volver a
desplegar tras un cambio de código".

## Dónde está todo

- El código fuente completo vive en GitHub:
  https://github.com/josecarlosvp28-BD/lalapiceria-sistema (repositorio
  privado — solo tú y quien tenga acceso a tu cuenta puede verlo).
- La documentación técnica de la migración a PHP está en
  [`MIGRATION_AUDIT.md`](MIGRATION_AUDIT.md), por si en el futuro alguien
  más retoma el desarrollo y necesita entender qué se decidió y por qué.
