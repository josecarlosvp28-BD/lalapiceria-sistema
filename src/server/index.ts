import { createApp } from "./app";
import { getDb, backupDatabase, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD } from "../db";

getDb(); // asegura que la base de datos y el esquema existan antes de aceptar tráfico

const usuariosExistentesAlInicio = getDb().prepare("SELECT COUNT(*) as count FROM usuarios").get() as {
  count: number;
};
if (usuariosExistentesAlInicio.count === 1) {
  console.log(`Usuario administrador creado: ${ADMIN_SEED_EMAIL} / ${ADMIN_SEED_PASSWORD}`);
  console.log("Por seguridad, inicia sesión y cambia esta contraseña cuanto antes.");
}

const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
setInterval(() => {
  try {
    backupDatabase();
  } catch (err) {
    console.error("Error al respaldar la base de datos:", err);
  }
}, SEIS_HORAS_MS);

const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();
app.listen(PORT, () => {
  console.log(`La Lapicería — servidor escuchando en el puerto ${PORT}`);
});
