import { Router } from 'express';
import trainerProfilePhotoController from '../controllers/TrainerProfilePhotoController';
import { trainerProfileUpload } from '../configs/multer';

const trainerProfilePhotoRoutes = Router();

// Upload de foto de perfil
trainerProfilePhotoRoutes.post(
  '/:trainer_id/profile-photo',
  trainerProfileUpload.single('photo'),
  trainerProfilePhotoController.upload
);

// Obter informações da foto de perfil
trainerProfilePhotoRoutes.get('/:trainer_id/profile-photo', trainerProfilePhotoController.show);

// Baixar arquivo da foto de perfil
trainerProfilePhotoRoutes.get('/:trainer_id/profile-photo/file', trainerProfilePhotoController.download);

// Deletar foto de perfil
trainerProfilePhotoRoutes.delete('/:trainer_id/profile-photo', trainerProfilePhotoController.delete);

export default trainerProfilePhotoRoutes;
