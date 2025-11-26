import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';

class ClientePhotosController {
  /**
   * @swagger
   * /clientes/{cliente_id}/photo:
   *   post:
   *     summary: Upload de foto de perfil do cliente
   *     tags: [Cliente Photos]
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
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
   *       400:
   *         description: Erro no upload
   *       404:
   *         description: Cliente não encontrado
   */
  async upload(req: Request, res: Response): Promise<Response> {
    const { cliente_id } = req.params;
    const file = req.file;

    // Validar se cliente_id é um número válido
    if (!cliente_id || isNaN(Number(cliente_id))) {
      throw new AppError('ID do cliente inválido', 400);
    }

    if (!file) {
      throw new AppError('Nenhum arquivo foi enviado', 400);
    }

    // Verificar se o cliente existe
    const cliente = await knex('clientes').where({ id: cliente_id }).first();

    if (!cliente) {
      // Deletar o arquivo que foi salvo
      fs.unlinkSync(file.path);
      throw new AppError('Cliente não encontrado', 404);
    }

    // Verificar se já existe uma foto de perfil para este cliente
    const existingPhoto = await knex('cliente_photos')
      .where({ cliente_id, is_profile: true })
      .first();

    // Se existir, deletar a foto antiga do sistema de arquivos
    if (existingPhoto) {
      const oldFilePath = path.resolve(__dirname, '..', '..', 'uploads', 'cliente-photos', existingPhoto.filename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Deletar registro antigo do banco
      await knex('cliente_photos').where({ id: existingPhoto.id }).delete();
    }

    // Salvar informações da foto no banco de dados
    const insertResult = await knex('cliente_photos').insert({
      cliente_id,
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
   * /clientes/{cliente_id}/photo:
   *   get:
   *     summary: Obter foto de perfil do cliente
   *     tags: [Cliente Photos]
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
   *     responses:
   *       200:
   *         description: Foto encontrada
   *       404:
   *         description: Foto não encontrada
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { cliente_id } = req.params;

    const photo = await knex('cliente_photos')
      .where({ cliente_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    return res.json(photo);
  }

  /**
   * @swagger
   * /clientes/{cliente_id}/photo/file:
   *   get:
   *     summary: Baixar arquivo de foto de perfil do cliente
   *     tags: [Cliente Photos]
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
   *     responses:
   *       200:
   *         description: Arquivo da foto
   *       404:
   *         description: Foto não encontrada
   */
  async download(req: Request, res: Response): Promise<void> {
    const { cliente_id } = req.params;

    const photo = await knex('cliente_photos')
      .where({ cliente_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'cliente-photos', photo.filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor', 404);
    }

    res.sendFile(filePath);
  }

  /**
   * @swagger
   * /clientes/{cliente_id}/photo:
   *   delete:
   *     summary: Deletar foto de perfil do cliente
   *     tags: [Cliente Photos]
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
   *     responses:
   *       204:
   *         description: Foto deletada com sucesso
   *       404:
   *         description: Foto não encontrada
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { cliente_id } = req.params;

    const photo = await knex('cliente_photos')
      .where({ cliente_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    // Deletar arquivo do sistema
    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'cliente-photos', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar registro do banco
    await knex('cliente_photos').where({ id: photo.id }).delete();

    return res.status(204).send();
  }
}

export default new ClientePhotosController();
