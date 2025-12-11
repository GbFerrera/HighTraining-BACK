import { Router } from 'express';
import timelineController from '../controllers/TimelineController';
import { timelineUpload } from '../configs/multer';

const timelineRoutes = Router();

// Criar entrada na timeline (foto + descrição + data/hora)
timelineRoutes.post(
  '/:student_id/entries',
  timelineUpload.single('photo'),
  timelineController.upload
);

// Listar entradas da timeline de um aluno
timelineRoutes.get('/:student_id/entries', timelineController.index);

// Obter informação de uma entrada específica
timelineRoutes.get('/entries/:entry_id', timelineController.show);

// Baixar arquivo da foto de uma entrada
timelineRoutes.get('/entries/:entry_id/file', timelineController.download);

// Atualizar descrição/data-hora de uma entrada
timelineRoutes.put('/entries/:entry_id', timelineController.update);

// Deletar uma entrada
timelineRoutes.delete('/entries/:entry_id', timelineController.delete);

export default timelineRoutes;
