import { Router } from 'express';
import feedbackController from '../controllers/FeedbackController';

const feedbackRoutes = Router();

// Criar feedback
feedbackRoutes.post('/', feedbackController.create);

// Listar feedbacks com filtros e paginação
feedbackRoutes.get('/', feedbackController.index);

// Obter feedback específico
feedbackRoutes.get('/:id', feedbackController.show);

// Atualizar feedback
feedbackRoutes.put('/:id', feedbackController.update);

// Deletar feedback
feedbackRoutes.delete('/:id', feedbackController.delete);

export default feedbackRoutes;
