import { Router } from 'express';
import exerciseTrainingsController from '../controllers/ExerciseTrainingsController';

const exerciseTrainingsRoutes = Router();

exerciseTrainingsRoutes.post("/", exerciseTrainingsController.create);
exerciseTrainingsRoutes.get("/", exerciseTrainingsController.index);
exerciseTrainingsRoutes.get("/training/:training_id", exerciseTrainingsController.getByTraining);
exerciseTrainingsRoutes.get("/:id", exerciseTrainingsController.show);
exerciseTrainingsRoutes.delete("/:id", exerciseTrainingsController.delete);

export default exerciseTrainingsRoutes;
