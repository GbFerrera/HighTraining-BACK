import { Router } from 'express';
import trainingsController from '../controllers/TrainingsController';

const trainingsRoutes = Router();

trainingsRoutes.post("/", trainingsController.create);
trainingsRoutes.get("/", trainingsController.index);
trainingsRoutes.get("/:id", trainingsController.show);
trainingsRoutes.put("/:id", trainingsController.update);
trainingsRoutes.delete("/:id", trainingsController.delete);

export default trainingsRoutes;
