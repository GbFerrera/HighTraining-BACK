import { Request, Response } from 'express';
import knex from '../database/knex';
import AppError from '../utils/AppError';

const table = 'trainer_schedules';

class TrainerSchedulesController {
  async index(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);
    if (!trainer_id) throw new AppError('É necessário enviar o ID do treinador', 400);

    const trainer = await knex('trainers').where({ id: trainer_id, admin_id }).first();
    if (!trainer) throw new AppError('Treinador não encontrado', 404);

    const rows = await knex(table)
      .where({ trainer_id })
      .orderBy([{ column: 'day_of_week', order: 'asc' }, { column: 'start_time', order: 'asc' }]);
    return res.json(rows);
  }

  async create(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;
    const admin_id = req.headers.admin_id as string;
    const { day_of_week, start_time, end_time } = req.body as any;
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);
    if (!trainer_id) throw new AppError('É necessário enviar o ID do treinador', 400);
    if (day_of_week === undefined || !start_time || !end_time) throw new AppError('Campos obrigatórios: day_of_week, start_time, end_time', 400);

    const trainer = await knex('trainers').where({ id: trainer_id, admin_id }).first();
    if (!trainer) throw new AppError('Treinador não encontrado', 404);

    const [row] = await knex(table)
      .insert({ trainer_id, day_of_week, start_time, end_time })
      .returning(['id', 'trainer_id', 'day_of_week', 'start_time', 'end_time', 'created_at', 'updated_at']);
    return res.status(201).json(row);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { trainer_id, id } = req.params as any;
    const admin_id = req.headers.admin_id as string;
    const { day_of_week, start_time, end_time, is_active } = req.body as any;
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);
    if (!trainer_id || !id) throw new AppError('É necessário enviar o ID do treinador e do horário', 400);

    const trainer = await knex('trainers').where({ id: trainer_id, admin_id }).first();
    if (!trainer) throw new AppError('Treinador não encontrado', 404);

    const exists = await knex(table).where({ id, trainer_id }).first();
    if (!exists) throw new AppError('Horário não encontrado', 404);

    const updated: any = {
      day_of_week: day_of_week ?? exists.day_of_week,
      start_time: start_time ?? exists.start_time,
      end_time: end_time ?? exists.end_time,
      is_active: is_active ?? exists.is_active,
      updated_at: knex.fn.now(),
    };
    await knex(table).update(updated).where({ id });
    const row = await knex(table).where({ id }).first();
    return res.json({ message: 'Horário atualizado com sucesso', horario: row });
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { trainer_id, id } = req.params as any;
    const admin_id = req.headers.admin_id as string;
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);
    if (!trainer_id || !id) throw new AppError('É necessário enviar o ID do treinador e do horário', 400);
    const trainer = await knex('trainers').where({ id: trainer_id, admin_id }).first();
    if (!trainer) throw new AppError('Treinador não encontrado', 404);
    const exists = await knex(table).where({ id, trainer_id }).first();
    if (!exists) throw new AppError('Horário não encontrado', 404);
    await knex(table).where({ id }).delete();
    return res.json({ message: 'Horário removido com sucesso' });
  }

  async replaceAll(req: Request, res: Response): Promise<Response> {
    const { trainer_id } = req.params as any;
    const admin_id = req.headers.admin_id as string;
    const { slots } = req.body as any; // [{day_of_week, start_time, end_time}]
    if (!admin_id) throw new AppError('É necessário enviar o ID do admin', 400);
    if (!trainer_id) throw new AppError('É necessário enviar o ID do treinador', 400);
    if (!Array.isArray(slots)) throw new AppError('slots deve ser uma lista', 400);

    const trainer = await knex('trainers').where({ id: trainer_id, admin_id }).first();
    if (!trainer) throw new AppError('Treinador não encontrado', 404);

    await knex.transaction(async (trx) => {
      await trx(table).where({ trainer_id }).delete();
      if (slots.length > 0) {
        const rows = slots.map((s: any) => ({
          trainer_id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
        }));
        await trx(table).insert(rows);
      }
    });

    const after = await knex(table).where({ trainer_id }).orderBy('day_of_week');
    return res.json({ message: 'Horários substituídos com sucesso', horarios: after });
  }
}

export default new TrainerSchedulesController();
