import { Router } from 'express';
import routineTrainingsController from '../controllers/RoutineTrainingsController';

const routineTrainingsRoutes = Router();

routineTrainingsRoutes.post('/', routineTrainingsController.create);
routineTrainingsRoutes.get('/', routineTrainingsController.index);
routineTrainingsRoutes.get('/:id', routineTrainingsController.show);
routineTrainingsRoutes.get('/:id/resolved-exercises', routineTrainingsController.resolvedExercises);
routineTrainingsRoutes.put('/:id', routineTrainingsController.update);
routineTrainingsRoutes.delete('/:id', routineTrainingsController.delete);

export default routineTrainingsRoutes;
