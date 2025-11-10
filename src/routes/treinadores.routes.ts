import { Router } from 'express';
import treinadoresController from '../controllers/TreinadoresController';

const treinadoresRoutes = Router();

treinadoresRoutes.post("/", treinadoresController.create);
treinadoresRoutes.get("/", treinadoresController.index);
treinadoresRoutes.get("/:id", treinadoresController.show);
treinadoresRoutes.put("/:id", treinadoresController.update);
treinadoresRoutes.delete("/:id", treinadoresController.delete);

export default treinadoresRoutes;
