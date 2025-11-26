import { Router } from 'express';
import feedbackPhotosController from '../controllers/FeedbackPhotosController';
import { feedbackUpload } from '../configs/multer';

const feedbackPhotosRoutes = Router();

// Upload de múltiplas fotos para um feedback
feedbackPhotosRoutes.post(
  '/:feedback_id/photos',
  feedbackUpload.array('photos', 10), // Máximo 10 fotos
  feedbackPhotosController.upload
);

// Listar fotos de um feedback
feedbackPhotosRoutes.get('/:feedback_id/photos', feedbackPhotosController.index);

// Obter informações de uma foto específica
feedbackPhotosRoutes.get('/photos/:photo_id', feedbackPhotosController.show);

// Baixar arquivo de uma foto
feedbackPhotosRoutes.get('/photos/:photo_id/file', feedbackPhotosController.download);

// Atualizar descrição de uma foto
feedbackPhotosRoutes.put('/photos/:photo_id', feedbackPhotosController.update);

// Deletar uma foto
feedbackPhotosRoutes.delete('/photos/:photo_id', feedbackPhotosController.delete);

export default feedbackPhotosRoutes;
