import express from "express";

import { formularioLogin, registrar, confirmar, formularioRegistro, resetPassword, formularioOlvidePassword, comprobarToken, nuevaPassword, autenticar} from "../controllers/usuariosControllers.js";

const router = express.Router();

// Login
router.get("/login", formularioLogin)
router.post("/login", autenticar)

// Registro
router.get("/register", formularioRegistro)
router.post("/register", registrar)

// Confirmar 
router.get("/confirmar/:token", confirmar)

// Olvidar contraseña
router.get("/forgot-password", formularioOlvidePassword)
router.post("/forgot-password", resetPassword)

// Validar el Olvide Contraseña
router.get("/forgot-password/:token", comprobarToken)
router.post("/forgot-password/:token", nuevaPassword)


export default router;