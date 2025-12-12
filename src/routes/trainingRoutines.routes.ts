import { Router } from 'express';
import trainingRoutinesController from '../controllers/TrainingRoutinesController';

const trainingRoutinesRoutes = Router();

trainingRoutinesRoutes.post('/', trainingRoutinesController.create);
trainingRoutinesRoutes.get('/', trainingRoutinesController.index);
trainingRoutinesRoutes.get('/student/:student_id/complete', trainingRoutinesController.getStudentCompleteRoutines);
trainingRoutinesRoutes.get('/:id', trainingRoutinesController.show);
trainingRoutinesRoutes.put('/:id', trainingRoutinesController.update);
trainingRoutinesRoutes.delete('/:id', trainingRoutinesController.delete);

export default trainingRoutinesRoutes;
