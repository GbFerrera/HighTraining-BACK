import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

class AgendaPointController {
  async create(req: Request, res: Response): Promise<Response> {
    const { cliente_id, training_date, duration_times, notes, day_week } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("O ID do admin é obrigatório", 400);
    if (!cliente_id || !training_date) throw new AppError("ID do cliente e data do treino são obrigatórios", 400);

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) throw new AppError("Admin não encontrado", 404);

    const cliente = await knex("clientes").where({ id: cliente_id, admin_id }).first();
    if (!cliente) throw new AppError("Cliente não encontrado", 404);

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [agendaPoint] = await knex("agenda_point")
      .insert({ admin_id, cliente_id, training_date, duration_times: duration_times || null, notes: notes || null, day_week: day_week || null, created_at: now, updated_at: now })
      .returning(["id", "admin_id", "cliente_id", "training_date", "duration_times", "notes", "day_week", "created_at", "updated_at"]);

    return res.status(201).json(agendaPoint);
  }

  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { cliente_id, start_date, end_date } = req.query;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    let query = knex("agenda_point")
      .select("agenda_point.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where("agenda_point.admin_id", admin_id);

    if (cliente_id) query = query.where("agenda_point.cliente_id", cliente_id);
    if (start_date) query = query.where("agenda_point.training_date", ">=", start_date);
    if (end_date) query = query.where("agenda_point.training_date", "<=", end_date);

    const agendaPoints = await query.orderBy("agenda_point.training_date", "asc");
    return res.json(agendaPoints);
  }

  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id || !admin_id) throw new AppError("É necessário enviar os IDs", 400);

    const agendaPoint = await knex("agenda_point")
      .select("agenda_point.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where({ "agenda_point.id": id, "agenda_point.admin_id": admin_id })
      .first();
    
    if (!agendaPoint) throw new AppError("Agendamento não encontrado", 404);
    return res.json(agendaPoint);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { training_date, duration_times, notes, day_week } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    const agendaPoint = await knex("agenda_point").where({ id, admin_id }).first();
    if (!agendaPoint) throw new AppError("Agendamento não encontrado", 404);

    await knex("agenda_point").update({
      training_date: training_date || agendaPoint.training_date,
      duration_times: duration_times !== undefined ? duration_times : agendaPoint.duration_times,
      notes: notes !== undefined ? notes : agendaPoint.notes,
      day_week: day_week !== undefined ? day_week : agendaPoint.day_week,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }).where({ id, admin_id });

    const updated = await knex("agenda_point")
      .select("agenda_point.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where({ "agenda_point.id": id, "agenda_point.admin_id": admin_id })
      .first();

    return res.status(200).json({ message: "Agendamento atualizado com sucesso", agendaPoint: updated });
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) throw new AppError("É necessário enviar os IDs", 400);

    const agendaPoint = await knex("agenda_point").where({ id, admin_id }).first();
    if (!agendaPoint) throw new AppError("Agendamento não encontrado", 404);
    
    await knex("agenda_point").where({ id, admin_id }).delete();
    return res.json({ message: "Agendamento excluído com sucesso" });
  }

  async getByDate(req: Request, res: Response): Promise<Response> {
    const { date } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !date) throw new AppError("É necessário enviar os parâmetros", 400);

    const startOfDay = moment(date).startOf('day').format("YYYY-MM-DD HH:mm:ss");
    const endOfDay = moment(date).endOf('day').format("YYYY-MM-DD HH:mm:ss");

    const agendaPoints = await knex("agenda_point")
      .select("agenda_point.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where("agenda_point.admin_id", admin_id)
      .whereBetween("agenda_point.training_date", [startOfDay, endOfDay])
      .orderBy("agenda_point.training_date", "asc");
    
    return res.json(agendaPoints);
  }
}

export default new AgendaPointController();
