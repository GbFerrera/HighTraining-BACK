import { Router } from 'express';
import studentProfilePhotoController from '../controllers/StudentProfilePhotoController';
import { studentProfileUpload } from '../configs/multer';

const studentProfilePhotoRoutes = Router();

// Upload de foto de perfil
studentProfilePhotoRoutes.post(
  '/:student_id/profile-photo',
  studentProfileUpload.single('photo'),
  studentProfilePhotoController.upload
);

// Obter informações da foto de perfil
studentProfilePhotoRoutes.get('/:student_id/profile-photo', studentProfilePhotoController.show);

// Baixar arquivo da foto de perfil
studentProfilePhotoRoutes.get('/:student_id/profile-photo/file', studentProfilePhotoController.download);

// Deletar foto de perfil
studentProfilePhotoRoutes.delete('/:student_id/profile-photo', studentProfilePhotoController.delete);

export default studentProfilePhotoRoutes;
