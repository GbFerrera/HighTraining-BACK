import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateRoutineTrainingDTO {
  routine_id: number;
  training_id: number;
  order?: number;
  is_active?: boolean;
  notes?: string;
}

class RoutineTrainingsController {
  /**
   * @swagger
   * /routine-trainings:
   *   post:
   *     summary: Link training to routine
   *     tags: [RoutineTrainings]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [routine_id, training_id]
   *             properties:
   *               routine_id:
   *                 type: integer
   *               training_id:
   *                 type: integer
   *               order:
   *                 type: integer
   *               is_active:
   *                 type: boolean
   *               notes:
   *                 type: string
   */
  async create(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { routine_id, training_id, order, is_active, notes } = req.body as CreateRoutineTrainingDTO;

    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);
    if (!routine_id || !training_id) {
      throw new AppError('routine_id e training_id são obrigatórios', 400);
    }

    // Verifica se a rotina existe e pertence ao admin
    const routine = await knex('training_routines')
      .where({ id: routine_id, admin_id })
      .first();
    if (!routine) throw new AppError('Rotina não encontrada', 404);

    // Verifica se o training existe e pertence ao admin
    const training = await knex('trainings')
      .leftJoin('trainers', 'trainings.trainer_id', 'trainers.id')
      .where({ 'trainings.id': training_id })
      .andWhere('trainers.admin_id', admin_id)
      .first();
    if (!training) throw new AppError('Treino não encontrado', 404);

    // Verifica se já existe esse vínculo
    const existing = await knex('routine_trainings')
      .where({ routine_id, training_id })
      .first();
    if (existing) {
      throw new AppError('Este treino já está vinculado a esta rotina', 400);
    }

    const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    const [routineTraining] = await knex('routine_trainings')
      .insert({
        routine_id,
        training_id,
        order: order || null,
        is_active: is_active !== undefined ? is_active : true,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .returning('*');

    return res.status(201).json(routineTraining);
  }

  /**
   * @swagger
   * /routine-trainings:
   *   get:
   *     summary: List routine-training links
   *     tags: [RoutineTrainings]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: routine_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: training_id
   *         schema:
   *           type: integer
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { routine_id, training_id } = req.query as any;

    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    let query = knex('routine_trainings')
      .select(
        'routine_trainings.*',
        'trainings.name as training_name',
        'trainings.day_of_week',
        'trainings.notes as training_notes',
        'training_routines.student_id',
        'students.name as student_name'
      )
      .leftJoin('trainings', 'routine_trainings.training_id', 'trainings.id')
      .leftJoin('training_routines', 'routine_trainings.routine_id', 'training_routines.id')
      .leftJoin('students', 'training_routines.student_id', 'students.id')
      .where('training_routines.admin_id', admin_id);

    if (routine_id) query = query.where('routine_trainings.routine_id', routine_id);
    if (training_id) query = query.where('routine_trainings.training_id', training_id);

    const rows = await query.orderBy('routine_trainings.order', 'asc');
    return res.json(rows);
  }

  /**
   * @swagger
   * /routine-trainings/{id}:
   *   get:
   *     summary: Get routine-training link by ID
   *     tags: [RoutineTrainings]
   */
  async show(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { id } = req.params;

    if (!admin_id || !id) throw new AppError('É necessário enviar os IDs', 400);

    const row = await knex('routine_trainings')
      .select(
        'routine_trainings.*',
        'trainings.name as training_name',
        'trainings.day_of_week',
        'trainings.notes as training_notes'
      )
      .leftJoin('trainings', 'routine_trainings.training_id', 'trainings.id')
      .leftJoin('training_routines', 'routine_trainings.routine_id', 'training_routines.id')
      .where({ 'routine_trainings.id': id })
      .andWhere('training_routines.admin_id', admin_id)
      .first();

    if (!row) throw new AppError('Registro não encontrado', 404);
    return res.json(row);
  }

  /**
   * @swagger
   * /routine-trainings/{id}:
   *   put:
   *     summary: Update routine-training link
   *     tags: [RoutineTrainings]
   */
  async update(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { id } = req.params;
    const { order, is_active, notes } = req.body as any;

    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    // Verifica se existe e pertence ao admin
    const existing = await knex('routine_trainings')
      .leftJoin('training_routines', 'routine_trainings.routine_id', 'training_routines.id')
      .where({ 'routine_trainings.id': id })
      .andWhere('training_routines.admin_id', admin_id)
      .first();

    if (!existing) throw new AppError('Registro não encontrado', 404);

    await knex('routine_trainings')
      .update({
        order: order !== undefined ? order : existing.order,
        is_active: is_active !== undefined ? is_active : existing.is_active,
        notes: notes !== undefined ? notes : existing.notes,
        updated_at: moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss'),
      })
      .where({ id });

    const updated = await knex('routine_trainings')
      .select(
        'routine_trainings.*',
        'trainings.name as training_name',
        'trainings.day_of_week',
        'trainings.notes as training_notes'
      )
      .leftJoin('trainings', 'routine_trainings.training_id', 'trainings.id')
      .where({ 'routine_trainings.id': id })
      .first();

    return res.status(200).json({ message: 'Registro atualizado com sucesso', routineTraining: updated });
  }

  /**
   * @swagger
   * /routine-trainings/{id}:
   *   delete:
   *     summary: Remove training from routine
   *     tags: [RoutineTrainings]
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { id } = req.params;

    if (!admin_id || !id) throw new AppError('É necessário enviar os IDs', 400);

    // Verifica se existe e pertence ao admin
    const existing = await knex('routine_trainings')
      .leftJoin('training_routines', 'routine_trainings.routine_id', 'training_routines.id')
      .where({ 'routine_trainings.id': id })
      .andWhere('training_routines.admin_id', admin_id)
      .first();

    if (!existing) throw new AppError('Registro não encontrado', 404);

    await knex('routine_trainings').where({ id }).delete();
    return res.json({ message: 'Treino removido da rotina com sucesso' });
  }
}

export default new RoutineTrainingsController();
