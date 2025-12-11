import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import path from 'path';
import fs from 'fs';

class TimelineController {
  /**
   * @swagger
   * /timeline/{student_id}/entries:
   *   post:
   *     summary: Create timeline entry with photo
   *     tags: [Timeline]
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
   *               description:
   *                 type: string
   *               event_at:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: Timeline entry created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TimelineEntry'
   *       400:
   *         description: Dados inválidos
   *       404:
   *         description: Aluno não encontrado
   */
  async upload(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;
    const { description, event_at } = req.body as any;
    const file = req.file as Express.Multer.File | undefined;

    if (!student_id || isNaN(Number(student_id))) {
      throw new AppError('ID do aluno inválido', 400);
    }
    if (!file) {
      throw new AppError('Nenhum arquivo foi enviado', 400);
    }

    const student = await knex('students').where({ id: student_id }).first();
    if (!student) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError('Aluno não encontrado', 404);
    }

    const payload: any = {
      student_id,
      filename: file.filename,
      filepath: file.path,
      mimetype: file.mimetype,
      size: file.size,
      description: description || null,
      event_at: event_at || knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    };

    const insertResult = await knex('timeline_entries').insert(payload).returning('*');
    const entry = Array.isArray(insertResult) ? insertResult[0] : insertResult;
    return res.status(201).json(entry);
  }

  /**
   * @swagger
   * /timeline/{student_id}/entries:
   *   get:
   *     summary: List timeline entries for a student
   *     tags: [Timeline]
   *     parameters:
   *       - in: path
   *         name: student_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de entradas
   */
  async index(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;

    if (!student_id || isNaN(Number(student_id))) {
      throw new AppError('ID do aluno inválido', 400);
    }

    const student = await knex('students').where({ id: student_id }).first();
    if (!student) throw new AppError('Aluno não encontrado', 404);

    const entries = await knex('timeline_entries')
      .where({ student_id })
      .orderBy('event_at', 'desc');

    return res.json(entries);
  }

  /**
   * @swagger
   * /timeline/entries/{entry_id}/file:
   *   get:
   *     summary: Download timeline entry photo file
   *     tags: [Timeline]
   *     parameters:
   *       - in: path
   *         name: entry_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Arquivo da foto
   */
  async download(req: Request, res: Response): Promise<void> {
    const { entry_id } = req.params as any;

    if (!entry_id || isNaN(Number(entry_id))) {
      throw new AppError('ID da entrada inválido', 400);
    }

    const entry = await knex('timeline_entries').where({ id: entry_id }).first();
    if (!entry) throw new AppError('Entrada não encontrada', 404);

    const filePath = path.resolve(
      __dirname,
      '..',
      '..',
      'uploads',
      'timeline-photos',
      entry.filename
    );

    if (!fs.existsSync(filePath)) {
      throw new AppError('Arquivo não encontrado no servidor', 404);
    }

    res.sendFile(filePath);
  }

  /**
   * @swagger
   * /timeline/entries/{entry_id}:
   *   get:
   *     summary: Get timeline entry info
   *     tags: [Timeline]
   *     parameters:
   *       - in: path
   *         name: entry_id
   *         required: true
   *         schema:
   *           type: integer
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { entry_id } = req.params as any;

    if (!entry_id || isNaN(Number(entry_id))) {
      throw new AppError('ID da entrada inválido', 400);
    }

    const entry = await knex('timeline_entries')
      .select(
        'timeline_entries.*',
        'students.name as student_name'
      )
      .leftJoin('students', 'timeline_entries.student_id', 'students.id')
      .where('timeline_entries.id', entry_id)
      .first();

    if (!entry) throw new AppError('Entrada não encontrada', 404);
    return res.json(entry);
  }

  /**
   * @swagger
   * /timeline/entries/{entry_id}:
   *   put:
   *     summary: Update timeline entry
   *     tags: [Timeline]
   *     parameters:
   *       - in: path
   *         name: entry_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateTimelineEntryDTO'
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { entry_id } = req.params as any;
    const { description, event_at } = req.body as any;

    if (!entry_id || isNaN(Number(entry_id))) {
      throw new AppError('ID da entrada inválido', 400);
    }

    const existing = await knex('timeline_entries').where({ id: entry_id }).first();
    if (!existing) throw new AppError('Entrada não encontrada', 404);

    const updateResult = await knex('timeline_entries')
      .where({ id: entry_id })
      .update({
        description: description !== undefined ? description : existing.description,
        event_at: event_at !== undefined ? event_at : existing.event_at,
        updated_at: knex.fn.now()
      })
      .returning('*');

    const entry = Array.isArray(updateResult) ? updateResult[0] : updateResult;
    return res.json(entry);
  }

  /**
   * @swagger
   * /timeline/entries/{entry_id}:
   *   delete:
   *     summary: Delete timeline entry
   *     tags: [Timeline]
   *     parameters:
   *       - in: path
   *         name: entry_id
   *         required: true
   *         schema:
   *           type: integer
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { entry_id } = req.params as any;

    if (!entry_id || isNaN(Number(entry_id))) {
      throw new AppError('ID da entrada inválido', 400);
    }

    const existing = await knex('timeline_entries').where({ id: entry_id }).first();
    if (!existing) throw new AppError('Entrada não encontrada', 404);

    const filePath = path.resolve(
      __dirname,
      '..',
      '..',
      'uploads',
      'timeline-photos',
      existing.filename
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await knex('timeline_entries').where({ id: entry_id }).delete();
    return res.status(204).send();
  }
}

export default new TimelineController();
