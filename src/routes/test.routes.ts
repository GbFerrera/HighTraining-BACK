import { Router } from 'express';
import testUploadController from '../controllers/TestUploadController';
import { studentProfileUpload } from '../configs/multer';

const testRoutes = Router();

// Test upload endpoint
testRoutes.post(
  '/test-upload',
  studentProfileUpload.single('photo'),
  testUploadController.testUpload
);

export default testRoutes;
