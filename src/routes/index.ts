import { Router } from 'express';
import sessionsRoutes from './sessions.routes';
import adminsRoutes from './admins.routes';
import treinadoresRoutes from './treinadores.routes';
import clientesRoutes from './clientes.routes';
import trainingsRoutes from './trainings.routes';
import clientTrainingRoutes from './clientTraining.routes';
import clienteEstatisticRoutes from './clienteEstatistic.routes';
import agendaPointRoutes from './agendaPoint.routes';
import exercisesRoutes from './exercises.routes';
import exerciseTrainingsRoutes from './exerciseTrainings.routes';

const routes = Router();

routes.use("/sessions", sessionsRoutes);
routes.use("/admins", adminsRoutes);
routes.use("/treinadores", treinadoresRoutes);
routes.use("/clientes", clientesRoutes);
routes.use("/trainings", trainingsRoutes);
routes.use("/client-training", clientTrainingRoutes);
routes.use("/cliente-estatistic", clienteEstatisticRoutes);
routes.use("/agenda-point", agendaPointRoutes);
routes.use("/exercises", exercisesRoutes);
routes.use("/exercise-trainings", exerciseTrainingsRoutes);

export default routes;
