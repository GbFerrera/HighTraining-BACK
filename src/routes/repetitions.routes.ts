import { Router } from 'express';
import repetitionsController from '../controllers/RepetitionsController';

const repetitionsRoutes = Router();

// Rotas específicas devem vir antes das rotas genéricas
repetitionsRoutes.get('/exercise/:exercise_id', repetitionsController.getByExercise);
repetitionsRoutes.get('/load-progress/student/:student_id', repetitionsController.loadProgressByStudent);
repetitionsRoutes.post('/auto/:exercise_id', repetitionsController.createAuto);

// Rotas específicas para cada tipo de repetição
repetitionsRoutes.post("/running", repetitionsController.createRunning);
repetitionsRoutes.post("/cadence", repetitionsController.createCadence);
repetitionsRoutes.post("/notes", repetitionsController.createNotes);
repetitionsRoutes.post("/time-incline", repetitionsController.createTimeIncline);
repetitionsRoutes.post("/reps-load", repetitionsController.createRepsLoad);
repetitionsRoutes.post("/reps-load-time", repetitionsController.createRepsLoadTime);
repetitionsRoutes.post("/complete-set", repetitionsController.createCompleteSet);
repetitionsRoutes.post("/reps-time", repetitionsController.createRepsTime);

// Rotas genéricas (manter compatibilidade)
repetitionsRoutes.post("/:type", repetitionsController.create);
repetitionsRoutes.get("/:type", repetitionsController.index);
repetitionsRoutes.get("/:type/:id", repetitionsController.show);
repetitionsRoutes.delete("/:type/:id", repetitionsController.delete);
repetitionsRoutes.patch("/:type/:id/load", repetitionsController.updateLoad);

export default repetitionsRoutes;
