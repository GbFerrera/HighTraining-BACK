import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';

class TrainerProfilePhotoController {
  /**
   * @swagger
   * /trainers/{trainer_id}/profile-photo:
   *   post:
   *     summary: Upload trainer profile photo
   *     tags: [Trainer Profile Photos]
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
   *         description: Profile photo uploaded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TrainerProfilePhoto'
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

    console.log('=== UPLOAD FOTO PERFIL TREINADOR ===');
    console.log('Trainer ID:', trainer_id);
    console.log('File recebido:', file ? 'SIM' : 'NÃO');

    // Validar se trainer_id é um número válido
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
    const trainer = await knex('trainers').where({ id: trainer_id }).first();

    if (!trainer) {
      // Deletar o arquivo que foi salvo
      fs.unlinkSync(file.path);
      throw new AppError('Treinador não encontrado', 404);
    }

    // Verificar se já existe uma foto de perfil para este treinador
    const existingPhoto = await knex('trainer_profile_photo')
      .where({ trainer_id })
      .first();

    // Se existir, deletar a foto antiga do sistema de arquivos
    if (existingPhoto) {
      const oldFilePath = path.resolve(__dirname, '..', '..', 'uploads', 'trainer-profile-photos', existingPhoto.filename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Atualizar registro existente
      await knex('trainer_profile_photo')
        .where({ trainer_id })
        .update({
          filename: file.filename,
          filepath: file.path,
          mimetype: file.mimetype,
          size: file.size,
          updated_at: knex.fn.now()
        });

      const updatedPhoto = await knex('trainer_profile_photo')
        .where({ trainer_id })
        .first();

      return res.status(200).json(updatedPhoto);
    } else {
      // Criar novo registro
      const insertResult = await knex('trainer_profile_photo').insert({
        trainer_id,
        filename: file.filename,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }).returning('*');

      const photo = Array.isArray(insertResult) ? insertResult[0] : insertResult;

      return res.status(201).json(photo);
    }
  }

  /**
   * @swagger
   * /trainers/{trainer_id}/profile-photo:
   *   get:
   *     summary: Get trainer profile photo
   *     tags: [Trainer Profile Photos]
   *     parameters:
   *       - in: path
   *         name: trainer_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Trainer ID
   *     responses:
   *       200:
   *         description: Profile photo found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TrainerProfilePhoto'
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;

    const photo = await knex('trainer_profile_photo')
      .where({ trainer_id })
      .first();

    if (!photo) {
      throw new AppError('Foto de perfil não encontrada', 404);
    }

    return res.json(photo);
  }

  /**
   * @swagger
   * /trainers/{trainer_id}/profile-photo/file:
   *   get:
   *     summary: Download trainer profile photo file
   *     tags: [Trainer Profile Photos]
   *     parameters:
   *       - in: path
   *         name: trainer_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Trainer ID
   *     responses:
   *       200:
   *         description: Profile photo file
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

    const photo = await knex('trainer_profile_photo')
      .where({ trainer_id })
      .first();

    if (!photo) {
      throw new AppError('Foto de perfil não encontrada', 404);
    }

    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'trainer-profile-photos', photo.filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor', 404);
    }

    res.sendFile(filePath);
  }

  /**
   * @swagger
   * /trainers/{trainer_id}/profile-photo:
   *   delete:
   *     summary: Delete trainer profile photo
   *     tags: [Trainer Profile Photos]
   *     parameters:
   *       - in: path
   *         name: trainer_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Trainer ID
   *     responses:
   *       204:
   *         description: Profile photo deleted
   *       404:
   *         description: Foto não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;

    const photo = await knex('trainer_profile_photo')
      .where({ trainer_id })
      .first();

    if (!photo) {
      throw new AppError('Foto de perfil não encontrada', 404);
    }

    // Deletar arquivo do sistema
    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'trainer-profile-photos', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar registro do banco
    await knex('trainer_profile_photo').where({ trainer_id }).delete();

    return res.status(204).send();
  }
}

export default new TrainerProfilePhotoController();
