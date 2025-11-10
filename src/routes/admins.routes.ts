import { Router } from 'express';
import adminsController from '../controllers/AdminsController';

const adminsRoutes = Router();

adminsRoutes.post("/", adminsController.create);
adminsRoutes.get("/", adminsController.index);
adminsRoutes.get("/:id", adminsController.show);
adminsRoutes.put("/:id", adminsController.update);
adminsRoutes.delete("/:id", adminsController.delete);

export default adminsRoutes;
