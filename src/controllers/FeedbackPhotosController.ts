import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import CloudinaryStorageService from '../services/CloudinaryStorageService';

class FeedbackPhotosController {
  /**
   * @swagger
   * /feedback/{feedback_id}/photos:
   *   post:
   *     summary: Upload photos for feedback
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: feedback_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Feedback ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               photos:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *               description:
   *                 type: string
   *                 description: Descrição opcional para as fotos
   *     responses:
   *       201:
   *         description: Photos uploaded
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/FeedbackPhoto'
   *       400:
   *         description: Erro no upload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Feedback não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async upload(req: Request, res: Response): Promise<Response> {
    const { feedback_id } = req.params;
    const { description } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validar se feedback_id é um número válido
    if (!feedback_id || isNaN(Number(feedback_id))) {
      throw new AppError('ID do feedback inválido', 400);
    }

    if (!files || files.length === 0) {
      throw new AppError('Nenhum arquivo foi enviado', 400);
    }

    // Verificar se o feedback existe
    const feedback = await knex('feedback').where({ id: feedback_id }).first();

    if (!feedback) {
      throw new AppError('Feedback não encontrado', 404);
    }

    try {
      // Upload files to Cloudinary
      const uploadPromises = files.map(file => 
        CloudinaryStorageService.uploadFeedbackPhoto(
          file.buffer,
          file.originalname,
          Number(feedback_id)
        )
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      
      // Salvar informações das fotos no banco de dados
      const photosData = files.map((file, index) => ({
        feedback_id,
        filename: uploadResults[index].filename,
        filepath: uploadResults[index].downloadURL,
        mimetype: file.mimetype,
        size: file.size,
        description: description || null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }));

      const insertResult = await knex('feedback_photos').insert(photosData).returning('*');
      const photos = Array.isArray(insertResult) ? insertResult : [insertResult];

      return res.status(201).json(photos);
    } catch (error) {
      console.error('Erro no upload para Cloudinary:', error);
      throw new AppError('Erro ao fazer upload das imagens', 500);
    }
  }

  /**
   * @swagger
   * /feedback/{feedback_id}/photos:
   *   get:
   *     summary: List photos for feedback
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: feedback_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Feedback ID
   *     responses:
   *       200:
   *         description: Feedback photos list
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/FeedbackPhoto'
   *       404:
   *         description: Feedback não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async index(req: Request, res: Response): Promise<Response> {
    const { feedback_id } = req.params;

    if (!feedback_id || isNaN(Number(feedback_id))) {
      throw new AppError('ID do feedback inválido', 400);
    }

    // Verificar se o feedback existe
    const feedback = await knex('feedback').where({ id: feedback_id }).first();
    if (!feedback) {
      throw new AppError('Feedback não encontrado', 404);
    }

    const photos = await knex('feedback_photos')
      .where({ feedback_id })
      .orderBy('created_at', 'desc');

    return res.json(photos);
  }

  /**
   * @swagger
   * /feedback/photos/{photo_id}/file:
   *   get:
   *     summary: Download feedback photo file
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: photo_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Photo ID
   *     responses:
   *       200:
   *         description: Photo file
   *         content:
   *           image/*:
   *             schema:
   *               type: string
   *               format: binary
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async download(req: Request, res: Response): Promise<void> {
    const { photo_id } = req.params;

    if (!photo_id || isNaN(Number(photo_id))) {
      throw new AppError('ID da foto inválido', 400);
    }

    const photo = await knex('feedback_photos').where({ id: photo_id }).first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    // Redirect to Cloudinary URL (stored in filepath)
    if (!photo.filepath) {
      throw new AppError('URL de download não encontrada', 404);
    }

    res.redirect(photo.filepath);
  }

  /**
   * @swagger
   * /feedback/photos/{photo_id}:
   *   get:
   *     summary: Get feedback photo info
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: photo_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Photo ID
   *     responses:
   *       200:
   *         description: Photo info
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FeedbackPhoto'
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { photo_id } = req.params;

    if (!photo_id || isNaN(Number(photo_id))) {
      throw new AppError('ID da foto inválido', 400);
    }

    const photo = await knex('feedback_photos')
      .select(
        'feedback_photos.*',
        'feedback.note as feedback_note',
        'admins.name as admin_name',
        'trainers.name as trainer_name',
        'students.name as student_name'
      )
      .leftJoin('feedback', 'feedback_photos.feedback_id', 'feedback.id')
      .leftJoin('admins', 'feedback.admin_id', 'admins.id')
      .leftJoin('trainers', 'feedback.trainer_id', 'trainers.id')
      .leftJoin('students', 'feedback.student_id', 'students.id')
      .where('feedback_photos.id', photo_id)
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    return res.json(photo);
  }

  /**
   * @swagger
   * /feedback/photos/{photo_id}:
   *   put:
   *     summary: Update feedback photo description
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: photo_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da foto
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               description:
   *                 type: string
   *                 description: Nova descrição da foto
   *     responses:
   *       200:
   *         description: Foto atualizada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FeedbackPhoto'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { photo_id } = req.params;
    const { description } = req.body;

    if (!photo_id || isNaN(Number(photo_id))) {
      throw new AppError('ID da foto inválido', 400);
    }

    // Verificar se foto existe
    const existingPhoto = await knex('feedback_photos').where({ id: photo_id }).first();
    if (!existingPhoto) {
      throw new AppError('Foto não encontrada', 404);
    }

    // Atualizar foto
    const updateResult = await knex('feedback_photos')
      .where({ id: photo_id })
      .update({
        description: description || null,
        updated_at: knex.fn.now()
      })
      .returning('*');

    const photo = Array.isArray(updateResult) ? updateResult[0] : updateResult;

    return res.json(photo);
  }

  /**
   * @swagger
   * /feedback/photos/{photo_id}:
   *   delete:
   *     summary: Delete feedback photo
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: photo_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da foto
   *     responses:
   *       204:
   *         description: Foto deletada com sucesso
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { photo_id } = req.params;

    if (!photo_id || isNaN(Number(photo_id))) {
      throw new AppError('ID da foto inválido', 400);
    }

    // Verificar se foto existe
    const existingPhoto = await knex('feedback_photos').where({ id: photo_id }).first();
    if (!existingPhoto) {
      throw new AppError('Foto não encontrada', 404);
    }

    // Deletar imagem do Cloudinary se existir
    if (existingPhoto.filepath && existingPhoto.filepath.includes('cloudinary')) {
      const urlParts = existingPhoto.filepath.split('/');
      const publicIdWithExtension = urlParts.slice(-2).join('/');
      const publicId = publicIdWithExtension.split('.')[0];
      try {
        await CloudinaryStorageService.deleteFile(publicId);
      } catch (error) {
        console.log('Erro ao deletar imagem do Cloudinary:', error);
      }
    }

    // Deletar registro do banco
    await knex('feedback_photos').where({ id: photo_id }).delete();

    return res.status(204).send();
  }
}

export default new FeedbackPhotosController();
