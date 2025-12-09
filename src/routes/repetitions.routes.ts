import { Router } from 'express';
import repetitionsController from '../controllers/RepetitionsController';

const repetitionsRoutes = Router();

repetitionsRoutes.post('/:type', repetitionsController.create);
repetitionsRoutes.get('/:type', repetitionsController.index);
repetitionsRoutes.get('/:type/:id', repetitionsController.show);
repetitionsRoutes.delete('/:type/:id', repetitionsController.delete);

export default repetitionsRoutes;
