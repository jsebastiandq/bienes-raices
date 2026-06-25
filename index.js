import express from "express";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import usuariosRouter from "./routes/usuariosRoutes.js";
import propiedadesRouter from "./routes/propiedadesRoutes.js";
import db from "./config/db.js";

// Crear APP
const app = express();

// Habilitar Pug
app.set("view engine", "pug");
app.set("views", "./views");

// Habilitar lectura de Forms
app.use(express.urlencoded({ extended: true }));

// Habilitar Cookie Parser
app.use(cookieParser());

// Habilitar el CSURF
app.use(csurf({ cookie: true }));

// Conexion a DB
try {
  await db.authenticate();
  db.sync();
  console.log("La conexion es exitosa");
} catch (error) {
  console.error("No se puede conectar", error);
}

// Definir Puerto
const PORT = process.env.PORT || 3000;

//Definir la ruta publica
app.use(express.static("public"));

// Rutas
app.use("/auth", usuariosRouter);
app.use("/", propiedadesRouter);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
