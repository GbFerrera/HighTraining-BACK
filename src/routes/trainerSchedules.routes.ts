import { Router } from 'express';
import controller from '../controllers/TrainerSchedulesController';

const trainerSchedulesRoutes = Router();

trainerSchedulesRoutes.get('/:trainer_id/schedules', controller.index);
trainerSchedulesRoutes.post('/:trainer_id/schedules', controller.create);
trainerSchedulesRoutes.put('/:trainer_id/schedules', controller.replaceAll);
trainerSchedulesRoutes.put('/:trainer_id/schedules/:id', controller.update);
trainerSchedulesRoutes.delete('/:trainer_id/schedules/:id', controller.delete);

export default trainerSchedulesRoutes;
