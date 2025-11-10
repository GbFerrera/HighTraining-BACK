import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

class ClienteEstatisticController {
  async create(req: Request, res: Response): Promise<Response> {
    const { cliente_id, weight, height, muscle_mass_percentage, notes } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("O ID do admin é obrigatório", 400);
    if (!cliente_id) throw new AppError("ID do cliente é obrigatório", 400);

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) throw new AppError("Admin não encontrado", 404);

    const cliente = await knex("clientes").where({ id: cliente_id, admin_id }).first();
    if (!cliente) throw new AppError("Cliente não encontrado", 404);

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [estatistic] = await knex("cliente_estatistic")
      .insert({ admin_id, cliente_id, weight: weight || null, height: height || null, muscle_mass_percentage: muscle_mass_percentage || null, notes: notes || null, created_at: now, updated_at: now })
      .returning(["id", "admin_id", "cliente_id", "weight", "height", "muscle_mass_percentage", "notes", "created_at", "updated_at"]);

    return res.status(201).json(estatistic);
  }

  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { cliente_id } = req.query;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    let query = knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where("cliente_estatistic.admin_id", admin_id);

    if (cliente_id) query = query.where("cliente_estatistic.cliente_id", cliente_id);

    const estatistics = await query.orderBy("cliente_estatistic.created_at", "desc");
    return res.json(estatistics);
  }

  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id || !admin_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.id": id, "cliente_estatistic.admin_id": admin_id })
      .first();
    
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);
    return res.json(estatistic);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { weight, height, muscle_mass_percentage, notes } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    const estatistic = await knex("cliente_estatistic").where({ id, admin_id }).first();
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);

    await knex("cliente_estatistic").update({
      weight: weight !== undefined ? weight : estatistic.weight,
      height: height !== undefined ? height : estatistic.height,
      muscle_mass_percentage: muscle_mass_percentage !== undefined ? muscle_mass_percentage : estatistic.muscle_mass_percentage,
      notes: notes !== undefined ? notes : estatistic.notes,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }).where({ id, admin_id });

    const updated = await knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.id": id, "cliente_estatistic.admin_id": admin_id })
      .first();

    return res.status(200).json({ message: "Estatística atualizada com sucesso", estatistic: updated });
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("cliente_estatistic").where({ id, admin_id }).first();
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);
    
    await knex("cliente_estatistic").where({ id, admin_id }).delete();
    return res.json({ message: "Estatística excluída com sucesso" });
  }

  async getLatest(req: Request, res: Response): Promise<Response> {
    const { cliente_id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !cliente_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.cliente_id": cliente_id, "cliente_estatistic.admin_id": admin_id })
      .orderBy("cliente_estatistic.created_at", "desc")
      .first();
    
    if (!estatistic) throw new AppError("Nenhuma estatística encontrada para este cliente", 404);
    return res.json(estatistic);
  }
}

export default new ClienteEstatisticController();
