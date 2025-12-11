import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';

class TreinadorPhotosController {
  /**
   * @swagger
   * /trainers/{trainer_id}/photo:
   *   post:
   *     summary: Upload trainer profile photo
   *     tags: [Trainer Photos]
   *     parameters:
   *       - in: path
   *         name: trainer_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Trainer ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               photo:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Photo uploaded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TreinadorPhoto'
   *       400:
   *         description: Erro no upload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Treinador não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async upload(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;
    const file = req.file;

    console.log('=== UPLOAD FOTO TREINADOR ===');
    console.log('Trainer ID:', trainer_id);
    console.log('File recebido:', file ? 'SIM' : 'NÃO');
    console.log('Headers:', req.headers);
    console.log('Body keys:', Object.keys(req.body));

    // Validar se treinador_id é um número válido
    if (!trainer_id || isNaN(Number(trainer_id))) {
      console.log('Erro: ID do treinador inválido');
      throw new AppError('ID do treinador inválido', 400);
    }

    if (!file) {
      console.log('Erro: Nenhum arquivo foi enviado');
      throw new AppError('Nenhum arquivo foi enviado', 400);
    }

    console.log('Arquivo detalhes:', {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Verificar se o treinador existe
    const treinador = await knex('trainers').where({ id: trainer_id }).first();

    if (!treinador) {
      // Deletar o arquivo que foi salvo
      fs.unlinkSync(file.path);
      throw new AppError('Treinador não encontrado', 404);
    }

    // Verificar se já existe uma foto de perfil para este treinador
    const existingPhoto = await knex('trainer_photos')
      .where({ trainer_id, is_profile: true })
      .first();

    // Se existir, deletar a foto antiga do sistema de arquivos
    if (existingPhoto) {
      const oldFilePath = path.resolve(__dirname, '..', '..', 'uploads', 'trainer-photos', existingPhoto.filename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Deletar registro antigo do banco
      await knex('trainer_photos').where({ id: existingPhoto.id }).delete();
    }

    // Salvar informações da foto no banco de dados
    const insertResult = await knex('trainer_photos').insert({
      trainer_id,
      filename: file.filename,
      filepath: file.path,
      mimetype: file.mimetype,
      size: file.size,
      is_profile: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }).returning('*');

    const photo = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    return res.status(201).json(photo);
  }

  /**
   * @swagger
   * /trainers/{trainer_id}/photo:
   *   get:
   *     summary: Get trainer profile photo
   *     tags: [Trainer Photos]
   *     parameters:
   *       - in: path
   *         name: trainer_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Trainer ID
   *     responses:
   *       200:
   *         description: Photo found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TreinadorPhoto'
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;

    const photo = await knex('trainer_photos')
      .where({ trainer_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    return res.json(photo);
  }

  /**
   * @swagger
   * /trainers/{trainer_id}/photo/file:
   *   get:
   *     summary: Download trainer photo file
   *     tags: [Trainer Photos]
   *     parameters:
   *       - in: path
   *         name: trainer_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Trainer ID
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
    const { trainer_id } = req.params as any;

    const photo = await knex('trainer_photos')
      .where({ trainer_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'trainer-photos', photo.filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor', 404);
    }

    res.sendFile(filePath);
  }

  /**
   * @swagger
   * /trainers/{trainer_id}/photo:
   *   delete:
   *     summary: Delete trainer profile photo
   *     tags: [Trainer Photos]
   *     parameters:
   *       - in: path
   *         name: trainer_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do treinador
   *     responses:
   *       204:
   *         description: Photo deleted
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;

    const photo = await knex('trainer_photos')
      .where({ trainer_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    // Deletar arquivo do sistema
    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'trainer-photos', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar registro do banco
    await knex('trainer_photos').where({ id: photo.id }).delete();

    return res.status(204).send();
  }
}

export default new TreinadorPhotosController();
