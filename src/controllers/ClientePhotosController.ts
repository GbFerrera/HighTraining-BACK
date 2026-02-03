import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import CloudinaryStorageService from '../services/CloudinaryStorageService';

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
      throw new AppError('Cliente não encontrado', 404);
    }

    // Verificar se já existe uma foto de perfil para este cliente
    const existingPhoto = await knex('student_photos')
      .where({ student_id, is_profile: true })
      .first();

    // Se existir, deletar a foto antiga do Cloudinary
    if (existingPhoto && existingPhoto.filepath && existingPhoto.filepath.includes('cloudinary')) {
      const urlParts = existingPhoto.filepath.split('/');
      const publicIdWithExtension = urlParts.slice(-2).join('/');
      const publicId = publicIdWithExtension.split('.')[0];
      try {
        await CloudinaryStorageService.deleteFile(publicId);
      } catch (error) {
        console.log('Erro ao deletar imagem antiga do Cloudinary:', error);
      }
    }
    // Deletar registro antigo do banco
    if (existingPhoto) {
      await knex('student_photos').where({ id: existingPhoto.id }).delete();
    }

    // Upload file to Cloudinary
    const uploadResult = await CloudinaryStorageService.uploadStudentProfilePhoto(
      file.buffer,
      file.originalname,
      Number(student_id)
    );
    const filepath = uploadResult.downloadURL;

    // Salvar informações da foto no banco de dados
    console.log('Salvando foto no banco de dados:', {
      student_id,
      filename: uploadResult.filename,
      filepath,
      mimetype: file.mimetype,
      size: file.size,
      is_profile: true
    });

    const insertResult = await knex('student_photos').insert({
      student_id,
      filename: uploadResult.filename,
      filepath,
      mimetype: file.mimetype,
      size: file.size,
      is_profile: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }).returning('*');

    const photo = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    console.log('Foto salva com sucesso:', photo);
    console.log('Cloudinary URL salva:', filepath);

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

    console.log('=== GET FOTOS PROGRESSO CLIENTE ===');
    console.log('Student ID:', student_id);

    // Buscar todas as fotos de progresso do estudante ordenadas por data (mais recente primeiro)
    const photos = await knex('student_photos')
      .where({ student_id, is_profile: true })
      .orderBy('created_at', 'desc')
      .select('*');
    
    console.log('Fotos de progresso encontradas:', photos.length);

    if (!photos || photos.length === 0) {
      console.log('Nenhuma foto de progresso encontrada para o estudante', student_id);
      throw new AppError('Nenhuma foto encontrada', 404);
    }

    console.log('Retornando fotos:', photos.map(p => ({
      id: p.id,
      filepath: p.filepath,
      created_at: p.created_at
    })));

    // Retornar todas as fotos para o carrossel
    return res.json({
      photos: photos,
      total: photos.length,
      latest: photos[0] // A mais recente sempre será a primeira
    });
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

    console.log('=== DOWNLOAD FOTO CLIENTE ===');
    console.log('Student ID:', student_id);

    const photo = await knex('student_photos')
      .where({ student_id, is_profile: true })
      .first();

    console.log('Foto encontrada no banco:', photo);

    if (!photo) {
      console.log('Erro: Foto não encontrada no banco de dados');
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
   * /students/{student_id}/photo:
   *   delete:
   *     summary: Delete student profile photo
   *     tags: [Student Photos]
   *     parameters:
   *       - in: path
   *         name: student_id
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

    // Deletar imagem do Cloudinary se existir
    if (photo.filepath && photo.filepath.includes('cloudinary')) {
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
    await knex('student_photos').where({ id: photo.id }).delete();

    return res.status(204).send();
  }
}

export default new ClientePhotosController();
