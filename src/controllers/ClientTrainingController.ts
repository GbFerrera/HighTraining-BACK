import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

class ClientTrainingController {
  /**
   * @swagger
   * /routine-trainings:
   *   post:
   *     summary: Create routine-training link
   *     tags: [Routine Trainings]
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
    const { routine_id, training_id, notes, order, is_active } = req.body as any;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("O ID do admin é obrigatório", 400);
    if (!routine_id || !training_id) throw new AppError("ID da rotina e do treino são obrigatórios", 400);

    const routine = await knex("training_routines").where({ id: routine_id, admin_id }).first();
    if (!routine) throw new AppError("Rotina não encontrada", 404);

    const training = await knex("trainings").where({ id: training_id }).first();
    if (!training) throw new AppError("Treino não encontrado", 404);

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [rt] = await knex("routine_trainings")
      .insert({ routine_id, training_id, order: order || null, is_active: is_active !== undefined ? is_active : true, notes: notes || null, created_at: now, updated_at: now })
      .returning(["id", "routine_id", "training_id", "order", "is_active", "notes", "created_at", "updated_at"]);

    return res.status(201).json(rt);
  }

  /**
   * @swagger
   * /routine-trainings:
   *   get:
   *     summary: List routine-training links
   *     tags: [Routine Trainings]
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

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    let query = knex("routine_trainings")
      .select(
        "routine_trainings.*",
        "training_routines.student_id",
        "training_routines.trainer_id",
        "trainings.name as training_name"
      )
      .leftJoin("training_routines", "routine_trainings.routine_id", "training_routines.id")
      .leftJoin("trainings", "routine_trainings.training_id", "trainings.id")
      .where("training_routines.admin_id", admin_id);

    if (routine_id) query = query.where("routine_trainings.routine_id", routine_id);
    if (training_id) query = query.where("routine_trainings.training_id", training_id);

    const rows = await query.orderBy("routine_trainings.order", "asc").orderBy("trainings.name", "asc");
    return res.json(rows);
  }

  /**
   * @swagger
   * /routine-trainings/{id}:
   *   get:
   *     summary: Get routine-training link by ID
   *     tags: [Routine Trainings]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id || !admin_id) throw new AppError("É necessário enviar os IDs", 400);

    const row = await knex("routine_trainings")
      .select(
        "routine_trainings.*",
        "training_routines.student_id",
        "training_routines.trainer_id",
        "trainings.name as training_name"
      )
      .leftJoin("training_routines", "routine_trainings.routine_id", "training_routines.id")
      .leftJoin("trainings", "routine_trainings.training_id", "trainings.id")
      .where({ "routine_trainings.id": id })
      .andWhere("training_routines.admin_id", admin_id)
      .first();
    
    if (!row) throw new AppError("Registro não encontrado", 404);
    return res.json(row);
  }

  /**
   * @swagger
   * /routine-trainings/{id}:
   *   put:
   *     summary: Update routine-training link
   *     tags: [Routine Trainings]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               order:
   *                 type: integer
   *               is_active:
   *                 type: boolean
   *               notes:
   *                 type: string
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { notes, order, is_active } = req.body as any;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    const existing = await knex("routine_trainings")
      .leftJoin("training_routines", "routine_trainings.routine_id", "training_routines.id")
      .where({ "routine_trainings.id": id })
      .andWhere("training_routines.admin_id", admin_id)
      .first();
    if (!existing) throw new AppError("Registro não encontrado", 404);

    await knex("routine_trainings").update({
      notes: notes !== undefined ? notes : existing.notes,
      order: order !== undefined ? order : existing.order,
      is_active: is_active !== undefined ? is_active : existing.is_active,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }).where({ id });

    const updated = await knex("routine_trainings")
      .leftJoin("training_routines", "routine_trainings.routine_id", "training_routines.id")
      .leftJoin("trainings", "routine_trainings.training_id", "trainings.id")
      .select("routine_trainings.*", "training_routines.student_id", "training_routines.trainer_id", "trainings.name as training_name")
      .where({ "routine_trainings.id": id })
      .andWhere("training_routines.admin_id", admin_id)
      .first();

    return res.status(200).json({ message: "Registro atualizado com sucesso", clientTraining: updated });
  }

  /**
   * @swagger
   * /routine-trainings/{id}:
   *   delete:
   *     summary: Delete routine-training link
   *     tags: [Routine Trainings]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) throw new AppError("É necessário enviar os IDs", 400);

    const existing = await knex("routine_trainings")
      .leftJoin("training_routines", "routine_trainings.routine_id", "training_routines.id")
      .where({ "routine_trainings.id": id })
      .andWhere("training_routines.admin_id", admin_id)
      .first();
    if (!existing) throw new AppError("Registro não encontrado", 404);
    
    await knex("routine_trainings").where({ id }).delete();
    return res.json({ message: "Registro excluído com sucesso" });
  }
}

export default new ClientTrainingController();
