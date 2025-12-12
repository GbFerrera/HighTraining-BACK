import { Router } from 'express';
import exercisesController from '../controllers/ExercisesController';

const exercisesRoutes = Router();

// Rota de teste
exercisesRoutes.get("/test", (req, res) => {
  console.log('🧪 Rota de teste acessada!');
  res.json({ message: "Rota de exercícios funcionando!", timestamp: new Date() });
});

exercisesRoutes.post("/", exercisesController.create);
exercisesRoutes.get("/", exercisesController.index);
exercisesRoutes.get("/:id", exercisesController.show);
exercisesRoutes.put("/:id", exercisesController.update);
exercisesRoutes.delete("/:id", exercisesController.delete);

export default exercisesRoutes;
