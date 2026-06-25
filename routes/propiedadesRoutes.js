import express from "express";
import { holita } from "../controllers/propiedadesControllers.js";

const router = express.Router();

router.get("/mis-propiedades", holita);

export default router;
