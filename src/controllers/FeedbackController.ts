import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import NotificationService from '../services/NotificationService';

class FeedbackController {
  /**
   * @swagger
   * /feedback:
   *   post:
   *     summary: Criar um novo feedback
   *     tags: [Feedback]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateFeedbackDTO'
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
   *         description: Admin, treinador ou cliente não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { admin_id, treinador_id, cliente_id, note } = req.body;

    // Validações básicas
    if (!admin_id || !treinador_id || !cliente_id || !note) {
      throw new AppError('Todos os campos são obrigatórios: admin_id, treinador_id, cliente_id, note', 400);
    }

    if (isNaN(Number(admin_id)) || isNaN(Number(treinador_id)) || isNaN(Number(cliente_id))) {
      throw new AppError('IDs devem ser números válidos', 400);
    }

    if (typeof note !== 'string' || note.trim().length === 0) {
      throw new AppError('A nota deve ser um texto válido', 400);
    }

    // Verificar se admin existe
    const admin = await knex('admins').where({ id: admin_id }).first();
    if (!admin) {
      throw new AppError('Admin não encontrado', 404);
    }

    // Verificar se treinador existe
    const treinador = await knex('treinadores').where({ id: treinador_id }).first();
    if (!treinador) {
      throw new AppError('Treinador não encontrado', 404);
    }

    // Verificar se cliente existe
    const cliente = await knex('clientes').where({ id: cliente_id }).first();
    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Criar feedback
    const insertResult = await knex('feedback').insert({
      admin_id,
      treinador_id,
      cliente_id,
      note: note.trim(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }).returning('*');

    const feedback = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    // Enviar notificação para o personal trainer
    try {
      const notificationService = req.app.get('notificationService') as NotificationService;
      if (notificationService) {
        await notificationService.sendFeedbackNotification(treinador_id, {
          id: feedback.id,
          cliente_id,
          cliente_name: cliente.name,
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
   *     summary: Listar todos os feedbacks
   *     tags: [Feedback]
   *     parameters:
   *       - in: query
   *         name: admin_id
   *         schema:
   *           type: integer
   *         description: Filtrar por ID do admin
   *       - in: query
   *         name: treinador_id
   *         schema:
   *           type: integer
   *         description: Filtrar por ID do treinador
   *       - in: query
   *         name: cliente_id
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
   *         description: Lista de feedbacks
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FeedbackListResponse'
   */
  async index(req: Request, res: Response): Promise<Response> {
    const { admin_id, treinador_id, cliente_id, page = 1, limit = 10 } = req.query;

    let query = knex('feedback')
      .select(
        'feedback.*',
        'admins.name as admin_name',
        'treinadores.name as treinador_name',
        'clientes.name as cliente_name'
      )
      .leftJoin('admins', 'feedback.admin_id', 'admins.id')
      .leftJoin('treinadores', 'feedback.treinador_id', 'treinadores.id')
      .leftJoin('clientes', 'feedback.cliente_id', 'clientes.id')
      .orderBy('feedback.created_at', 'desc');

    // Aplicar filtros se fornecidos
    if (admin_id) {
      query = query.where('feedback.admin_id', admin_id);
    }
    if (treinador_id) {
      query = query.where('feedback.treinador_id', treinador_id);
    }
    if (cliente_id) {
      query = query.where('feedback.cliente_id', cliente_id);
    }

    // Paginação
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNumber - 1) * limitNumber;

    const feedbacks = await query.limit(limitNumber).offset(offset);

    // Contar total para paginação
    let countQuery = knex('feedback').count('* as total');
    if (admin_id) countQuery = countQuery.where('admin_id', admin_id);
    if (treinador_id) countQuery = countQuery.where('treinador_id', treinador_id);
    if (cliente_id) countQuery = countQuery.where('cliente_id', cliente_id);

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
   *     summary: Obter um feedback específico
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
   *         description: Feedback encontrado
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
        'admins.name as admin_name',
        'treinadores.name as treinador_name',
        'clientes.name as cliente_name'
      )
      .leftJoin('admins', 'feedback.admin_id', 'admins.id')
      .leftJoin('treinadores', 'feedback.treinador_id', 'treinadores.id')
      .leftJoin('clientes', 'feedback.cliente_id', 'clientes.id')
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
   *     summary: Atualizar um feedback
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
   *         description: Feedback atualizado com sucesso
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
   *     summary: Deletar um feedback
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
   *         description: Feedback deletado com sucesso
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
