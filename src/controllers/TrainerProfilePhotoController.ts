import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import CloudinaryStorageService from '../services/CloudinaryStorageService';

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
      size: file.size,
      bufferLength: file.buffer ? file.buffer.length : 'undefined'
    });

    // Validar se o buffer existe e não está vazio
    if (!file.buffer || file.buffer.length === 0) {
      console.log('Erro: Buffer do arquivo está vazio');
      throw new AppError('Arquivo inválido ou corrompido', 400);
    }

    // Verificar se o treinador existe
    const trainer = await knex('trainers').where({ id: trainer_id }).first();

    if (!trainer) {
      throw new AppError('Treinador não encontrado', 404);
    }

    try {
      // Upload para Cloudinary
      const uploadResult = await CloudinaryStorageService.uploadTrainerProfilePhoto(
        file.buffer,
        file.originalname,
        Number(trainer_id)
      );

      // Verificar se já existe uma foto de perfil para este treinador
      const existingPhoto = await knex('trainer_profile_photo')
        .where({ trainer_id })
        .first();

      // Se existir, atualizar registro existente
      if (existingPhoto) {
        // Deletar imagem antiga do Cloudinary se existir
        if (existingPhoto.filepath && existingPhoto.filepath.includes('cloudinary')) {
          // Extrair public_id da URL do Cloudinary para deletar
          const urlParts = existingPhoto.filepath.split('/');
          const publicIdWithExtension = urlParts.slice(-2).join('/');
          const publicId = publicIdWithExtension.split('.')[0];
          try {
            await CloudinaryStorageService.deleteFile(publicId);
          } catch (error) {
            console.log('Erro ao deletar imagem antiga do Cloudinary:', error);
          }
        }

        // Atualizar registro existente
        await knex('trainer_profile_photo')
          .where({ trainer_id })
          .update({
            filename: uploadResult.filename,
            filepath: uploadResult.downloadURL, // Armazenar URL do Cloudinary no campo filepath
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
          filename: uploadResult.filename,
          filepath: uploadResult.downloadURL, // Armazenar URL do Cloudinary no campo filepath
          mimetype: file.mimetype,
          size: file.size,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        }).returning('*');

        const photo = Array.isArray(insertResult) ? insertResult[0] : insertResult;

        return res.status(201).json(photo);
      }
    } catch (error) {
      console.error('Erro no upload para Cloudinary:', error);
      throw new AppError('Erro ao fazer upload da imagem', 500);
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

    if (!photo.filepath) {
      throw new AppError('URL de download não encontrada', 404);
    }

    // Redirect to Cloudinary URL (stored in filepath)
    res.redirect(photo.filepath);
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

    // Deletar imagem do Cloudinary se existir
    if (photo.filepath && photo.filepath.includes('cloudinary')) {
      // Extrair public_id da URL do Cloudinary para deletar
      const urlParts = photo.filepath.split('/');
      const publicIdWithExtension = urlParts.slice(-2).join('/');
      const publicId = publicIdWithExtension.split('.')[0];
      try {
        await CloudinaryStorageService.deleteFile(publicId);
      } catch (error) {
        console.log('Erro ao deletar imagem do Cloudinary:', error);
      }
    }

    // Deletar registro do banco
    await knex('trainer_profile_photo').where({ trainer_id }).delete();

    return res.status(204).send();
  }
}

export default new TrainerProfilePhotoController();
