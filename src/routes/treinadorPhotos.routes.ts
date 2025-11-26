import { Router } from 'express';
import treinadorPhotosController from '../controllers/TreinadorPhotosController';
import { treinadorUpload } from '../configs/multer';

const treinadorPhotosRoutes = Router();

// Upload de foto de perfil
treinadorPhotosRoutes.post(
  '/:treinador_id/photo',
  treinadorUpload.single('photo'),
  treinadorPhotosController.upload
);

// Obter informações da foto
treinadorPhotosRoutes.get('/:treinador_id/photo', treinadorPhotosController.show);

// Baixar arquivo da foto
treinadorPhotosRoutes.get('/:treinador_id/photo/file', treinadorPhotosController.download);

// Deletar foto
treinadorPhotosRoutes.delete('/:treinador_id/photo', treinadorPhotosController.delete);

export default treinadorPhotosRoutes;
