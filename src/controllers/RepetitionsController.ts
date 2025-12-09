import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

type RepType = 'reps-load' | 'reps-load-time' | 'complete-set' | 'reps-time';

const TABLES: Record<RepType, string> = {
  'reps-load': 'rep_reps_load',
  'reps-load-time': 'rep_reps_load_time',
  'complete-set': 'rep_complete_set',
  'reps-time': 'rep_reps_time',
};

class RepetitionsController {
  async create(req: Request, res: Response): Promise<Response> {
    const { type } = req.params as { type: RepType };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('O ID do admin é obrigatório', 400);

    const body = req.body || {};
    const exercise_id = Number(body.exercise_id);
    if (!exercise_id || isNaN(exercise_id)) throw new AppError('exercise_id inválido', 400);

    const exercise = await knex('exercises')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ 'exercises.id': exercise_id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();
    if (!exercise) throw new AppError('Exercício não encontrado', 404);

    const now = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    const table = TABLES[type];
    let payload: any = { exercise_id, created_at: now };

    switch (type) {
      case 'reps-load': {
        const { set, reps, load, rest } = body;
        if ([set, reps, load, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, load, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), rest: Number(rest) };
        break;
      }
      case 'reps-load-time': {
        const { reps, load, time } = body;
        if ([reps, load, time].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: reps, load, time', 400);
        payload = { ...payload, reps: Number(reps), load: Number(load), time: Number(time) };
        break;
      }
      case 'complete-set': {
        const { set, reps, load, time, rest } = body;
        if ([set, reps, load, time, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, load, time, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), time: Number(time), rest: Number(rest) };
        break;
      }
      case 'reps-time': {
        const { set, reps, time, rest } = body;
        if ([set, reps, time, rest].some((v: any) => v === undefined)) throw new AppError('Campos obrigatórios: set, reps, time, rest', 400);
        payload = { ...payload, set: Number(set), reps: Number(reps), time: Number(time), rest: Number(rest) };
        break;
      }
    }

    const [row] = await knex(table).insert(payload).returning('*');
    return res.status(201).json(row);
  }

  async index(req: Request, res: Response): Promise<Response> {
    const { type } = req.params as { type: RepType };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const { exercise_id } = req.query as any;
    const table = TABLES[type];

    let query = knex(table)
      .select(`${table}.*`)
      .leftJoin('exercises', `${table}.exercise_id`, 'exercises.id')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      });

    if (exercise_id) query = query.where(`${table}.exercise_id`, exercise_id);

    const rows = await query.orderBy(`${table}.created_at`, 'desc');
    return res.json(rows);
  }

  async show(req: Request, res: Response): Promise<Response> {
    const { type, id } = req.params as { type: RepType; id: string };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const table = TABLES[type];

    const row = await knex(table)
      .select(`${table}.*`)
      .leftJoin('exercises', `${table}.exercise_id`, 'exercises.id')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ [`${table}.id`]: id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();

    if (!row) throw new AppError('Registro não encontrado', 404);
    return res.json(row);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { type, id } = req.params as { type: RepType; id: string };
    const admin_id = req.headers.admin_id as string;
    if (!type || !(type in TABLES)) throw new AppError('Invalid repetition type', 400);
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);

    const table = TABLES[type];

    const row = await knex(table)
      .leftJoin('exercises', `${table}.exercise_id`, 'exercises.id')
      .leftJoin('trainers', 'exercises.trainer_id', 'trainers.id')
      .where({ [`${table}.id`]: id })
      .andWhere(function() {
        this.where('trainers.admin_id', admin_id).orWhereNull('exercises.trainer_id');
      })
      .first();

    if (!row) throw new AppError('Registro não encontrado', 404);

    await knex(table).where({ id }).delete();
    return res.json({ message: 'Registro excluído com sucesso' });
  }
}

export default new RepetitionsController();
