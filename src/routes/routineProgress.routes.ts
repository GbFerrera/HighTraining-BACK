import { Router } from 'express';
import RoutineProgressController from '../controllers/RoutineProgressController';

const routineProgressRoutes = Router();

// POST /routine-progress - Create routine progress
routineProgressRoutes.post('/', RoutineProgressController.create);

// GET /routine-progress - List routine progress
routineProgressRoutes.get('/', RoutineProgressController.index);

// GET /routine-progress/:id - Get routine progress by ID
routineProgressRoutes.get('/:id', RoutineProgressController.show);

// PUT /routine-progress/:id - Update routine progress
routineProgressRoutes.put('/:id', RoutineProgressController.update);

// DELETE /routine-progress/:id - Delete routine progress
routineProgressRoutes.delete('/:id', RoutineProgressController.delete);

export default routineProgressRoutes;
