import { Router } from 'express';
import clientePhotosController from '../controllers/ClientePhotosController';
import { upload } from '../configs/multer';

const clientePhotosRoutes = Router();

// Upload de foto de perfil
clientePhotosRoutes.post(
  '/:cliente_id/photo',
  upload.single('photo'),
  clientePhotosController.upload
);

// Obter informações da foto
clientePhotosRoutes.get('/:cliente_id/photo', clientePhotosController.show);

// Baixar arquivo da foto
clientePhotosRoutes.get('/:cliente_id/photo/file', clientePhotosController.download);

// Deletar foto
clientePhotosRoutes.delete('/:cliente_id/photo', clientePhotosController.delete);

export default clientePhotosRoutes;
