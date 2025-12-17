import { Router } from 'express';
import repetitionsController from '../controllers/RepetitionsController';

const repetitionsRoutes = Router();

// Rotas específicas devem vir antes das rotas genéricas
repetitionsRoutes.get('/exercise/:exercise_id', repetitionsController.getByExercise.bind(repetitionsController));
repetitionsRoutes.get('/load-progress/student/:student_id', repetitionsController.loadProgressByStudent.bind(repetitionsController));
repetitionsRoutes.post('/auto/:exercise_id', repetitionsController.createAuto.bind(repetitionsController));

// Rotas específicas para cada tipo de repetição
repetitionsRoutes.post("/running", repetitionsController.createRunning.bind(repetitionsController));
repetitionsRoutes.post("/cadence", repetitionsController.createCadence.bind(repetitionsController));
repetitionsRoutes.post("/notes", repetitionsController.createNotes.bind(repetitionsController));
repetitionsRoutes.post("/time-incline", repetitionsController.createTimeIncline.bind(repetitionsController));
repetitionsRoutes.post("/reps-load", repetitionsController.createRepsLoad.bind(repetitionsController));
repetitionsRoutes.post("/reps-load-time", repetitionsController.createRepsLoadTime.bind(repetitionsController));
repetitionsRoutes.post("/complete-set", repetitionsController.createCompleteSet.bind(repetitionsController));
repetitionsRoutes.post("/reps-time", repetitionsController.createRepsTime.bind(repetitionsController));

// Rotas genéricas (manter compatibilidade)
repetitionsRoutes.post("/:type", repetitionsController.create.bind(repetitionsController));
repetitionsRoutes.get("/:type", repetitionsController.index.bind(repetitionsController));
repetitionsRoutes.get("/:type/:id", repetitionsController.show.bind(repetitionsController));
repetitionsRoutes.delete("/:type/:id", repetitionsController.delete.bind(repetitionsController));
repetitionsRoutes.patch("/:type/:id/load", repetitionsController.updateLoad.bind(repetitionsController));

export default repetitionsRoutes;
