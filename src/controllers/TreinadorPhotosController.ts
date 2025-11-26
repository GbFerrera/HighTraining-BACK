import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';

class TreinadorPhotosController {
  /**
   * @swagger
   * /treinadores/{treinador_id}/photo:
   *   post:
   *     summary: Upload de foto de perfil do treinador
   *     tags: [Treinador Photos]
   *     parameters:
   *       - in: path
   *         name: treinador_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do treinador
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
   *         description: Foto enviada com sucesso
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
    const { treinador_id } = req.params;
    const file = req.file;

    // Validar se treinador_id é um número válido
    if (!treinador_id || isNaN(Number(treinador_id))) {
      throw new AppError('ID do treinador inválido', 400);
    }

    if (!file) {
      throw new AppError('Nenhum arquivo foi enviado', 400);
    }

    // Verificar se o treinador existe
    const treinador = await knex('treinadores').where({ id: treinador_id }).first();

    if (!treinador) {
      // Deletar o arquivo que foi salvo
      fs.unlinkSync(file.path);
      throw new AppError('Treinador não encontrado', 404);
    }

    // Verificar se já existe uma foto de perfil para este treinador
    const existingPhoto = await knex('treinador_photos')
      .where({ treinador_id, is_profile: true })
      .first();

    // Se existir, deletar a foto antiga do sistema de arquivos
    if (existingPhoto) {
      const oldFilePath = path.resolve(__dirname, '..', '..', 'uploads', 'treinador-photos', existingPhoto.filename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Deletar registro antigo do banco
      await knex('treinador_photos').where({ id: existingPhoto.id }).delete();
    }

    // Salvar informações da foto no banco de dados
    const insertResult = await knex('treinador_photos').insert({
      treinador_id,
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
   * /treinadores/{treinador_id}/photo:
   *   get:
   *     summary: Obter foto de perfil do treinador
   *     tags: [Treinador Photos]
   *     parameters:
   *       - in: path
   *         name: treinador_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do treinador
   *     responses:
   *       200:
   *         description: Foto encontrada
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
    const { treinador_id } = req.params;

    const photo = await knex('treinador_photos')
      .where({ treinador_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    return res.json(photo);
  }

  /**
   * @swagger
   * /treinadores/{treinador_id}/photo/file:
   *   get:
   *     summary: Baixar arquivo de foto de perfil do treinador
   *     tags: [Treinador Photos]
   *     parameters:
   *       - in: path
   *         name: treinador_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do treinador
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
    const { treinador_id } = req.params;

    const photo = await knex('treinador_photos')
      .where({ treinador_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'treinador-photos', photo.filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor', 404);
    }

    res.sendFile(filePath);
  }

  /**
   * @swagger
   * /treinadores/{treinador_id}/photo:
   *   delete:
   *     summary: Deletar foto de perfil do treinador
   *     tags: [Treinador Photos]
   *     parameters:
   *       - in: path
   *         name: treinador_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do treinador
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
    const { treinador_id } = req.params;

    const photo = await knex('treinador_photos')
      .where({ treinador_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    // Deletar arquivo do sistema
    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'treinador-photos', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar registro do banco
    await knex('treinador_photos').where({ id: photo.id }).delete();

    return res.status(204).send();
  }
}

export default new TreinadorPhotosController();
