import { Router } from 'express';
import agendaPointController from '../controllers/AgendaPointController';

const agendaPointRoutes = Router();

agendaPointRoutes.post("/", agendaPointController.create);
agendaPointRoutes.get("/", agendaPointController.index);
agendaPointRoutes.get("/date/:date", agendaPointController.getByDate);
agendaPointRoutes.get("/:id", agendaPointController.show);
agendaPointRoutes.put("/:id", agendaPointController.update);
agendaPointRoutes.delete("/:id", agendaPointController.delete);

export default agendaPointRoutes;
