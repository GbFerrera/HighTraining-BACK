import { Router } from 'express';
import clientesController from '../controllers/ClientesController';

const clientesRoutes = Router();

clientesRoutes.post("/", clientesController.create);
clientesRoutes.get("/", clientesController.index);
clientesRoutes.get("/:id", clientesController.show);
clientesRoutes.put("/:id", clientesController.update);
clientesRoutes.delete("/:id", clientesController.delete);

export default clientesRoutes;
