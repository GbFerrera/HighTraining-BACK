import { Router } from 'express';
import repetitionsController from '../controllers/RepetitionsController';

const repetitionsRoutes = Router();

repetitionsRoutes.post('/:type', repetitionsController.create);
repetitionsRoutes.get('/:type', repetitionsController.index);
repetitionsRoutes.get('/:type/:id', repetitionsController.show);
repetitionsRoutes.delete('/:type/:id', repetitionsController.delete);
repetitionsRoutes.patch('/:type/:id/load', repetitionsController.updateLoad);
repetitionsRoutes.get('/load-progress/student/:student_id', repetitionsController.loadProgressByStudent);

export default repetitionsRoutes;
