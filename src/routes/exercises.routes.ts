import { Router } from 'express';
import exercisesController from '../controllers/ExercisesController';

const exercisesRoutes = Router();

exercisesRoutes.post("/", exercisesController.create);
exercisesRoutes.get("/", exercisesController.index);
exercisesRoutes.get("/:id", exercisesController.show);
exercisesRoutes.put("/:id", exercisesController.update);
exercisesRoutes.delete("/:id", exercisesController.delete);

export default exercisesRoutes;
