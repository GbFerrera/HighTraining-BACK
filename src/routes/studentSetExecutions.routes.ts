import { Router } from 'express';
import studentSetExecutionsController from '../controllers/StudentSetExecutionsController';

const studentSetExecutionsRoutes = Router();

// Criar ou atualizar execução de série
studentSetExecutionsRoutes.post('/', studentSetExecutionsController.create);

// Listar execuções (com filtros opcionais)
studentSetExecutionsRoutes.get('/', studentSetExecutionsController.index);

// Buscar performance dos alunos do personal
studentSetExecutionsRoutes.get('/trainer/performance', studentSetExecutionsController.getTrainerStudentsPerformance);

// Buscar execuções de um treino específico em uma data
studentSetExecutionsRoutes.get('/by-training-date', studentSetExecutionsController.getByTrainingDate);

// Buscar execução específica por ID
studentSetExecutionsRoutes.get('/:id', studentSetExecutionsController.show);

// Deletar execução
studentSetExecutionsRoutes.delete('/:id', studentSetExecutionsController.delete);

export default studentSetExecutionsRoutes;
