import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

class AgendaPointController {
  /**
   * @swagger
   * /schedule-appointments:
   *   post:
   *     summary: Create schedule appointment
   *     tags: [Schedule Appointments]
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
   *             required: [student_id, training_date]
   *             properties:
   *               student_id:
   *                 type: integer
   *               training_date:
   *                 type: string
   *                 format: date-time
   *               duration_times:
   *                 type: string
   *               day_week:
   *                 type: string
   *               notes:
   *                 type: string
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { cliente_id, training_date, duration_times, notes, day_week } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("O ID do admin é obrigatório", 400);
    if (!cliente_id || !training_date) throw new AppError("ID do cliente e data do treino são obrigatórios", 400);

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) throw new AppError("Admin não encontrado", 404);

    const cliente = await knex("students")
      .leftJoin("trainers", "students.trainer_id", "trainers.id")
      .where({ "students.id": cliente_id })
      .andWhere("trainers.admin_id", admin_id)
      .first();
    if (!cliente) throw new AppError("Cliente não encontrado", 404);

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [agendaPoint] = await knex("schedule_appointments")
      .insert({ admin_id, student_id: cliente_id, training_date, duration_times: duration_times || null, notes: notes || null, day_week: day_week || null, created_at: now, updated_at: now })
      .returning(["id", "admin_id", "student_id", "training_date", "duration_times", "notes", "day_week", "created_at", "updated_at"]);

    return res.status(201).json(agendaPoint);
  }

  /**
   * @swagger
   * /schedule-appointments:
   *   get:
   *     summary: List schedule appointments
   *     tags: [Schedule Appointments]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: student_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: start_date
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: end_date
   *         schema:
   *           type: string
   *           format: date-time
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { cliente_id, start_date, end_date } = req.query as any;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    let query = knex("schedule_appointments")
      .select("schedule_appointments.*", "students.name as student_name")
      .leftJoin("students", "schedule_appointments.student_id", "students.id")
      .where("schedule_appointments.admin_id", admin_id);

    if (cliente_id) query = query.where("schedule_appointments.student_id", cliente_id);
    if (start_date) query = query.where("schedule_appointments.training_date", ">=", start_date);
    if (end_date) query = query.where("schedule_appointments.training_date", "<=", end_date);

    const agendaPoints = await query.orderBy("schedule_appointments.training_date", "asc");
    return res.json(agendaPoints);
  }

  /**
   * @swagger
   * /schedule-appointments/{id}:
   *   get:
   *     summary: Get appointment by ID
   *     tags: [Schedule Appointments]
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

    const agendaPoint = await knex("schedule_appointments")
      .select("schedule_appointments.*", "students.name as student_name")
      .leftJoin("students", "schedule_appointments.student_id", "students.id")
      .where({ "schedule_appointments.id": id, "schedule_appointments.admin_id": admin_id })
      .first();
    
    if (!agendaPoint) throw new AppError("Agendamento não encontrado", 404);
    return res.json(agendaPoint);
  }

  /**
   * @swagger
   * /schedule-appointments/{id}:
   *   put:
   *     summary: Update appointment
   *     tags: [Schedule Appointments]
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
   *               training_date:
   *                 type: string
   *                 format: date-time
   *               duration_times:
   *                 type: string
   *               day_week:
   *                 type: string
   *               notes:
   *                 type: string
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { training_date, duration_times, notes, day_week } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    const agendaPoint = await knex("schedule_appointments").where({ id, admin_id }).first();
    if (!agendaPoint) throw new AppError("Agendamento não encontrado", 404);

    await knex("schedule_appointments").update({
      training_date: training_date || agendaPoint.training_date,
      duration_times: duration_times !== undefined ? duration_times : agendaPoint.duration_times,
      notes: notes !== undefined ? notes : agendaPoint.notes,
      day_week: day_week !== undefined ? day_week : agendaPoint.day_week,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }).where({ id, admin_id });

    const updated = await knex("schedule_appointments")
      .select("schedule_appointments.*", "students.name as student_name")
      .leftJoin("students", "schedule_appointments.student_id", "students.id")
      .where({ "schedule_appointments.id": id, "schedule_appointments.admin_id": admin_id })
      .first();

    return res.status(200).json({ message: "Agendamento atualizado com sucesso", agendaPoint: updated });
  }

  /**
   * @swagger
   * /schedule-appointments/{id}:
   *   delete:
   *     summary: Delete appointment
   *     tags: [Schedule Appointments]
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

    const agendaPoint = await knex("schedule_appointments").where({ id, admin_id }).first();
    if (!agendaPoint) throw new AppError("Agendamento não encontrado", 404);
    
    await knex("schedule_appointments").where({ id, admin_id }).delete();
    return res.json({ message: "Agendamento excluído com sucesso" });
  }

  /**
   * @swagger
   * /schedule-appointments/date/{date}:
   *   get:
   *     summary: Get appointments by date
   *     tags: [Schedule Appointments]
   *     parameters:
   *       - in: path
   *         name: date
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   */
  async getByDate(req: Request, res: Response): Promise<Response> {
    const { date } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !date) throw new AppError("É necessário enviar os parâmetros", 400);

    const startOfDay = moment(date).startOf('day').format("YYYY-MM-DD HH:mm:ss");
    const endOfDay = moment(date).endOf('day').format("YYYY-MM-DD HH:mm:ss");

    const agendaPoints = await knex("schedule_appointments")
      .select("schedule_appointments.*", "students.name as student_name")
      .leftJoin("students", "schedule_appointments.student_id", "students.id")
      .where("schedule_appointments.admin_id", admin_id)
      .whereBetween("schedule_appointments.training_date", [startOfDay, endOfDay])
      .orderBy("schedule_appointments.training_date", "asc");
    
    return res.json(agendaPoints);
  }
}

export default new AgendaPointController();
