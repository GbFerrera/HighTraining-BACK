import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import NotificationService from '../services/NotificationService';

class FeedbackController {
  /**
   * @swagger
   * /feedback:
   *   post:
   *     summary: Create feedback
   *     tags: [Feedback]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [student_id, note]
   *             properties:
   *               student_id:
   *                 type: integer
   *               note:
   *                 type: string
   *     responses:
   *       201:
   *         description: Feedback criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Feedback'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Cliente não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { student_id, note } = req.body;
    console.log(req.body)
    // Validações básicas
    if (!student_id || !note) {
      throw new AppError('Todos os campos são obrigatórios: student_id, note', 400);
    }

    if (isNaN(Number(student_id))) {
      throw new AppError('student_id deve ser um número válido', 400);
    }

    if (typeof note !== 'string' || note.trim().length === 0) {
      throw new AppError('A nota deve ser um texto válido', 400);
    }

    // Verificar se cliente existe e obter o treinador vinculado
    const cliente = await knex('students').where({ id: student_id }).first();
    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (!cliente.trainer_id) {
      throw new AppError('Cliente não está vinculado a nenhum treinador', 400);
    }

    // Criar feedback
    const insertResult = await knex('feedback').insert({
      trainer_id: cliente.trainer_id,
      student_id,
      note: note.trim(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }).returning('*');

    const feedback = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    // Enviar notificação para o personal trainer
    try {
      const notificationService = req.app.get('notificationService') as NotificationService;
      if (notificationService) {
        await notificationService.sendFeedbackNotification(cliente.trainer_id, {
          id: feedback.id,
          student_id,
          student_name: cliente.name,
          note: feedback.note,
          created_at: feedback.created_at
        });
      }
    } catch (notificationError) {
      console.error('Erro ao enviar notificação:', notificationError);
      // Não falha a criação do feedback se a notificação falhar
    }

    return res.status(201).json(feedback);
  }

  /**
   * @swagger
   * /feedback:
   *   get:
   *     summary: List feedbacks
   *     tags: [Feedback]
   *     parameters:
   *       - in: query
   *         name: trainer_id
   *         schema:
   *           type: integer
   *         description: Filtrar por ID do treinador
   *       - in: query
   *         name: student_id
   *         schema:
   *           type: integer
   *         description: Filtrar por ID do cliente
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número da página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Itens por página
   *     responses:
   *       200:
   *         description: Feedback list
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 feedbacks:
   *                   type: array
   *                   items:
   *                     type: object
   *                 pagination:
   *                   type: object
   */
  async index(req: Request, res: Response): Promise<Response> {
    const { trainer_id, student_id, page = 1, limit = 10 } = req.query as any;

    let query = knex('feedback')
      .select(
        'feedback.*',
        'trainers.name as trainer_name',
        'students.name as student_name'
      )
      .leftJoin('trainers', 'feedback.trainer_id', 'trainers.id')
      .leftJoin('students', 'feedback.student_id', 'students.id')
      .orderBy('feedback.created_at', 'desc');

    // Aplicar filtros se fornecidos
    if (trainer_id) {
      query = query.where('feedback.trainer_id', trainer_id);
    }
    if (student_id) {
      query = query.where('feedback.student_id', student_id);
    }

    // Paginação
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNumber - 1) * limitNumber;

    const feedbacks = await query.limit(limitNumber).offset(offset);

    // Contar total para paginação
    let countQuery = knex('feedback').count('* as total');
    if (trainer_id) countQuery = countQuery.where('trainer_id', trainer_id);
    if (student_id) countQuery = countQuery.where('student_id', student_id);

    const [{ total }] = await countQuery;

    return res.json({
      feedbacks,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: Number(total),
        pages: Math.ceil(Number(total) / limitNumber)
      }
    });
  }

  /**
   * @swagger
   * /feedback/{id}:
   *   get:
   *     summary: Get feedback by ID
   *     tags: [Feedback]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do feedback
   *     responses:
   *       200:
   *         description: Feedback found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Feedback'
   *       404:
   *         description: Feedback não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('ID do feedback inválido', 400);
    }

    const feedback = await knex('feedback')
      .select(
        'feedback.*',
        'trainers.name as trainer_name',
        'students.name as student_name'
      )
      .leftJoin('trainers', 'feedback.trainer_id', 'trainers.id')
      .leftJoin('students', 'feedback.student_id', 'students.id')
      .where('feedback.id', id)
      .first();

    if (!feedback) {
      throw new AppError('Feedback não encontrado', 404);
    }

    return res.json(feedback);
  }

  /**
   * @swagger
   * /feedback/{id}:
   *   put:
   *     summary: Update feedback
   *     tags: [Feedback]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do feedback
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateFeedbackDTO'
   *     responses:
   *       200:
   *         description: Feedback updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Feedback'
   *       400:
   *         description: Dados inválidos
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
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { note } = req.body;

    if (!id || isNaN(Number(id))) {
      throw new AppError('ID do feedback inválido', 400);
    }

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      throw new AppError('A nota deve ser um texto válido', 400);
    }

    // Verificar se feedback existe
    const existingFeedback = await knex('feedback').where({ id }).first();
    if (!existingFeedback) {
      throw new AppError('Feedback não encontrado', 404);
    }

    // Atualizar feedback
    const updateResult = await knex('feedback')
      .where({ id })
      .update({
        note: note.trim(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    const feedback = Array.isArray(updateResult) ? updateResult[0] : updateResult;

    return res.json(feedback);
  }

  /**
   * @swagger
   * /feedback/{id}:
   *   delete:
   *     summary: Delete feedback
   *     tags: [Feedback]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do feedback
   *     responses:
   *       204:
   *         description: Feedback deleted
   *       404:
   *         description: Feedback não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('ID do feedback inválido', 400);
    }

    // Verificar se feedback existe
    const existingFeedback = await knex('feedback').where({ id }).first();
    if (!existingFeedback) {
      throw new AppError('Feedback não encontrado', 404);
    }

    // Deletar feedback
    await knex('feedback').where({ id }).delete();

    return res.status(204).send();
  }
}

export default new FeedbackController();
