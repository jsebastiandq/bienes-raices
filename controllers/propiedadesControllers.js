import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import Usuario from "../models/Usuarios.js";
import { generarJWT, generarId } from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";
import csurf from "csurf";

const holita = (req, res) => {
  res.send("Hola mundo");
};

export { holita };
