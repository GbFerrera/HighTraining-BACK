import { Router } from 'express';
import clienteEstatisticController from '../controllers/ClienteEstatisticController';

const clienteEstatisticRoutes = Router();

clienteEstatisticRoutes.post("/", clienteEstatisticController.create);
clienteEstatisticRoutes.get("/", clienteEstatisticController.index);
clienteEstatisticRoutes.get("/latest/:student_id", clienteEstatisticController.getLatest);
clienteEstatisticRoutes.get("/measures/:student_id", clienteEstatisticController.getMedidas);
clienteEstatisticRoutes.get("/:id", clienteEstatisticController.show);
clienteEstatisticRoutes.put("/:id", clienteEstatisticController.update);
clienteEstatisticRoutes.delete("/:id", clienteEstatisticController.delete);

export default clienteEstatisticRoutes;
