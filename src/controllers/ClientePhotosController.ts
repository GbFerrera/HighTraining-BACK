import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';

class ClientePhotosController {
  /**
   * @swagger
   * /students/{student_id}/photo:
   *   post:
   *     summary: Upload student profile photo
   *     tags: [Student Photos]
   *     parameters:
   *       - in: path
   *         name: student_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Student ID
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
   *       400:
   *         description: Upload error
   *       404:
   *         description: Student not found
   */
  async upload(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;
    const file = req.file;

    console.log('=== UPLOAD FOTO CLIENTE ===');
    console.log('Student ID:', student_id);
    console.log('File recebido:', file ? 'SIM' : 'NÃO');
    console.log('Headers:', req.headers);
    console.log('Body keys:', Object.keys(req.body));

    // Validar se cliente_id é um número válido
    if (!student_id || isNaN(Number(student_id))) {
      console.log('Erro: ID do cliente inválido');
      throw new AppError('ID do cliente inválido', 400);
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

    // Verificar se o cliente existe
    const cliente = await knex('students').where({ id: student_id }).first();

    if (!cliente) {
      // Deletar o arquivo que foi salvo
      fs.unlinkSync(file.path);
      throw new AppError('Cliente não encontrado', 404);
    }

    // Verificar se já existe uma foto de perfil para este cliente
    const existingPhoto = await knex('student_photos')
      .where({ student_id, is_profile: true })
      .first();

    // Se existir, deletar a foto antiga do sistema de arquivos
    if (existingPhoto) {
      const oldFilePath = path.resolve(__dirname, '..', '..', 'uploads', 'student-photos', existingPhoto.filename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Deletar registro antigo do banco
      await knex('student_photos').where({ id: existingPhoto.id }).delete();
    }

    // Salvar informações da foto no banco de dados
    const insertResult = await knex('student_photos').insert({
      student_id,
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
   * /students/{student_id}/photo:
   *   get:
   *     summary: Get student profile photo
   *     tags: [Student Photos]
   *     parameters:
   *       - in: path
   *         name: student_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Student ID
   *     responses:
   *       200:
   *         description: Photo found
   *       404:
   *         description: Photo not found
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;

    const photo = await knex('student_photos')
      .where({ student_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    return res.json(photo);
  }

  /**
   * @swagger
   * /students/{student_id}/photo/file:
   *   get:
   *     summary: Download student photo file
   *     tags: [Student Photos]
   *     parameters:
   *       - in: path
   *         name: student_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Student ID
   *     responses:
   *       200:
   *         description: Photo file
   *       404:
   *         description: Photo not found
   */
  async download(req: Request, res: Response): Promise<void> {
    const { student_id } = req.params as any;

    const photo = await knex('student_photos')
      .where({ student_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404); 
    }

    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'student-photos', photo.filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor', 404);
    }

    res.sendFile(filePath);
  }

  /**
   * @swagger
   * /students/{student_id}/photo:
   *   delete:
   *     summary: Delete student profile photo
   *     tags: [Student Photos]
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
   *     responses:
   *       204:
   *         description: Photo deleted
   *       404:
   *         description: Photo not found
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;

    const photo = await knex('student_photos')
      .where({ student_id, is_profile: true })
      .first();

    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }

    // Deletar arquivo do sistema
    const filePath = path.resolve(__dirname, '..', '..', 'uploads', 'student-photos', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar registro do banco
    await knex('student_photos').where({ id: photo.id }).delete();

    return res.status(204).send();
  }
}

export default new ClientePhotosController();
