import { Router } from 'express';
import clientTrainingController from '../controllers/ClientTrainingController';

const clientTrainingRoutes = Router();

clientTrainingRoutes.post("/", clientTrainingController.create);
clientTrainingRoutes.get("/", clientTrainingController.index);
clientTrainingRoutes.get("/:id", clientTrainingController.show);
clientTrainingRoutes.put("/:id", clientTrainingController.update);
clientTrainingRoutes.delete("/:id", clientTrainingController.delete);

export default clientTrainingRoutes;
