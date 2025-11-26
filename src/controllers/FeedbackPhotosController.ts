import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';

class FeedbackPhotosController {
  /**
   * @swagger
   * /feedback/{feedback_id}/photos:
   *   post:
   *     summary: Upload de fotos para um feedback
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: feedback_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do feedback
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
   *         description: Fotos enviadas com sucesso
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
      // Deletar os arquivos que foram salvos
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      throw new AppError('Feedback não encontrado', 404);
    }

    try {
      // Salvar informações das fotos no banco de dados
      const photosData = files.map(file => ({
        feedback_id,
        filename: file.filename,
        filepath: file.path,
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
      // Em caso de erro, deletar os arquivos salvos
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      throw error;
    }
  }

  /**
   * @swagger
   * /feedback/{feedback_id}/photos:
   *   get:
   *     summary: Listar fotos de um feedback
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: feedback_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do feedback
   *     responses:
   *       200:
   *         description: Lista de fotos do feedback
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
   *     summary: Baixar arquivo de foto do feedback
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: photo_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da foto
   *     responses:
   *       200:
   *         description: Arquivo da foto
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

    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'feedback-photos', photo.filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor', 404);
    }

    res.sendFile(filePath);
  }

  /**
   * @swagger
   * /feedback/photos/{photo_id}:
   *   get:
   *     summary: Obter informações de uma foto específica
   *     tags: [Feedback Photos]
   *     parameters:
   *       - in: path
   *         name: photo_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da foto
   *     responses:
   *       200:
   *         description: Informações da foto
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
        'treinadores.name as treinador_name',
        'clientes.name as cliente_name'
      )
      .leftJoin('feedback', 'feedback_photos.feedback_id', 'feedback.id')
      .leftJoin('admins', 'feedback.admin_id', 'admins.id')
      .leftJoin('treinadores', 'feedback.treinador_id', 'treinadores.id')
      .leftJoin('clientes', 'feedback.cliente_id', 'clientes.id')
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
   *     summary: Atualizar descrição de uma foto
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
   *     summary: Deletar uma foto do feedback
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

    // Deletar arquivo do sistema
    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'feedback-photos', existingPhoto.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar registro do banco
    await knex('feedback_photos').where({ id: photo_id }).delete();

    return res.status(204).send();
  }
}

export default new FeedbackPhotosController();
