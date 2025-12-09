import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

class ClienteEstatisticController {
  /**
   * @swagger
   * /student-statistics:
   *   post:
   *     summary: Create student statistics
   *     tags: [Student Statistics]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [student_id]
   *             properties:
   *               student_id:
   *                 type: integer
   *               weight:
   *                 type: number
   *                 format: float
   *               height:
   *                 type: number
   *                 format: float
   *               muscle_mass_percentage:
   *                 type: number
   *                 format: float
   *               notes:
   *                 type: string
   *               shoulder:
   *                 type: number
   *               chest:
   *                 type: number
   *               left_arm:
   *                 type: number
   *               right_arm:
   *                 type: number
   *               left_forearm:
   *                 type: number
   *               right_forearm:
   *                 type: number
   *               wrist:
   *                 type: number
   *               waist:
   *                 type: number
   *               abdomen:
   *                 type: number
   *               hip:
   *                 type: number
   *               left_thigh:
   *                 type: number
   *               right_thigh:
   *                 type: number
   *               left_calf:
   *                 type: number
   *               right_calf:
   *                 type: number
   *     responses:
   *       201:
   *         description: Estatística criada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Admin ou cliente não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { 
      cliente_id, 
      weight, 
      height, 
      muscle_mass_percentage, 
      notes,
      ombro,
      torax,
      braco_esquerdo,
      braco_direito,
      antebraco_esquerdo,
      antebraco_direito,
      punho,
      cintura,
      abdome,
      quadril,
      coxa_esquerda,
      coxa_direita,
      panturrilha_esquerda,
      panturrilha_direita
    } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("O ID do admin é obrigatório", 400);
    if (!cliente_id) throw new AppError("ID do cliente é obrigatório", 400);

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) throw new AppError("Admin não encontrado", 404);

    const cliente = await knex("students")
      .leftJoin("trainers", "students.trainer_id", "trainers.id")
      .where({ "students.id": cliente_id })
      .andWhere("trainers.admin_id", admin_id)
      .first();
    if (!cliente) throw new AppError("Cliente não encontrado", 404);

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [estatistic] = await knex("student_statistics")
      .insert({ 
        admin_id, 
        student_id: cliente_id, 
        weight: weight || null, 
        height: height || null, 
        muscle_mass_percentage: muscle_mass_percentage || null, 
        notes: notes || null,
        shoulder: ombro || null,
        chest: torax || null,
        left_arm: braco_esquerdo || null,
        right_arm: braco_direito || null,
        left_forearm: antebraco_esquerdo || null,
        right_forearm: antebraco_direito || null,
        wrist: punho || null,
        waist: cintura || null,
        abdomen: abdome || null,
        hip: quadril || null,
        left_thigh: coxa_esquerda || null,
        right_thigh: coxa_direita || null,
        left_calf: panturrilha_esquerda || null,
        right_calf: panturrilha_direita || null,
        created_at: now, 
        updated_at: now 
      })
      .returning(["*"]); 

    return res.status(201).json(estatistic);
  }

  /**
   * @swagger
   * /student-statistics:
   *   get:
   *     summary: List student statistics
   *     tags: [Student Statistics]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *       - in: query
   *         name: student_id
   *         schema:
   *           type: number
   *         description: Filter by student ID
   *     responses:
   *       200:
   *         description: Statistics list
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: ID do admin é obrigatório
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { student_id } = req.query as any;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    let query = knex("student_statistics")
      .select("student_statistics.*", "students.name as student_name")
      .leftJoin("students", "student_statistics.student_id", "students.id")
      .where("student_statistics.admin_id", admin_id);

    if (student_id) query = query.where("student_statistics.student_id", student_id);

    const estatistics = await query.orderBy("student_statistics.created_at", "desc");
    return res.json(estatistics);
  }

  /**
   * @swagger
   * /student-statistics/{id}:
   *   get:
   *     summary: Get statistic by ID
   *     tags: [Student Statistics]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID da estatística
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Estatística encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Estatística não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id || !admin_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("student_statistics")
      .select("student_statistics.*", "students.name as student_name")
      .leftJoin("students", "student_statistics.student_id", "students.id")
      .where({ "student_statistics.id": id, "student_statistics.admin_id": admin_id })
      .first();
    
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);
    return res.json(estatistic);
  }

  /**
   * @swagger
   * /student-statistics/{id}:
   *   put:
   *     summary: Update student statistics
   *     tags: [Student Statistics]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID da estatística
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateClienteEstatisticDTO'
   *     responses:
   *       200:
   *         description: Estatística atualizada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Estatística atualizada com sucesso
   *                 estatistic:
   *                   $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: ID do admin é obrigatório
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Estatística não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { 
      weight, 
      height, 
      muscle_mass_percentage, 
      notes,
      ombro,
      torax,
      braco_esquerdo,
      braco_direito,
      antebraco_esquerdo,
      antebraco_direito,
      punho,
      cintura,
      abdome,
      quadril,
      coxa_esquerda,
      coxa_direita,
      panturrilha_esquerda,
      panturrilha_direita
    } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    const estatistic = await knex("student_statistics").where({ id, admin_id }).first();
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);

    await knex("student_statistics").update({
      weight: weight !== undefined ? weight : estatistic.weight,
      height: height !== undefined ? height : estatistic.height,
      muscle_mass_percentage: muscle_mass_percentage !== undefined ? muscle_mass_percentage : estatistic.muscle_mass_percentage,
      notes: notes !== undefined ? notes : estatistic.notes,
      shoulder: ombro !== undefined ? ombro : estatistic.shoulder,
      chest: torax !== undefined ? torax : estatistic.chest,
      left_arm: braco_esquerdo !== undefined ? braco_esquerdo : estatistic.left_arm,
      right_arm: braco_direito !== undefined ? braco_direito : estatistic.right_arm,
      left_forearm: antebraco_esquerdo !== undefined ? antebraco_esquerdo : estatistic.left_forearm,
      right_forearm: antebraco_direito !== undefined ? antebraco_direito : estatistic.right_forearm,
      wrist: punho !== undefined ? punho : estatistic.wrist,
      waist: cintura !== undefined ? cintura : estatistic.waist,
      abdomen: abdome !== undefined ? abdome : estatistic.abdomen,
      hip: quadril !== undefined ? quadril : estatistic.hip,
      left_thigh: coxa_esquerda !== undefined ? coxa_esquerda : estatistic.left_thigh,
      right_thigh: coxa_direita !== undefined ? coxa_direita : estatistic.right_thigh,
      left_calf: panturrilha_esquerda !== undefined ? panturrilha_esquerda : estatistic.left_calf,
      right_calf: panturrilha_direita !== undefined ? panturrilha_direita : estatistic.right_calf,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }).where({ id, admin_id });

    const updated = await knex("student_statistics")
      .select("student_statistics.*", "students.name as student_name")
      .leftJoin("students", "student_statistics.student_id", "students.id")
      .where({ "student_statistics.id": id, "student_statistics.admin_id": admin_id })
      .first();

    return res.status(200).json({ message: "Estatística atualizada com sucesso", estatistic: updated });
  }

  /**
   * @swagger
   * /student-statistics/{id}:
   *   delete:
   *     summary: Delete student statistics
   *     tags: [Student Statistics]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID da estatística
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Estatística excluída com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Estatística excluída com sucesso
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Estatística não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("student_statistics").where({ id, admin_id }).first();
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);
    
    await knex("student_statistics").where({ id, admin_id }).delete();
    return res.json({ message: "Estatística excluída com sucesso" });
  }

  /**
   * @swagger
   * /student-statistics/latest/{student_id}:
   *   get:
   *     summary: Get student's latest statistics
   *     tags: [Student Statistics]
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID do cliente
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Última estatística do cliente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Nenhuma estatística encontrada para este cliente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getLatest(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !student_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("student_statistics")
      .select("student_statistics.*", "students.name as student_name")
      .leftJoin("students", "student_statistics.student_id", "students.id")
      .where({ "student_statistics.student_id": student_id, "student_statistics.admin_id": admin_id })
      .orderBy("student_statistics.created_at", "desc")
      .first();
    
    if (!estatistic) throw new AppError("Nenhuma estatística encontrada para este cliente", 404);
    return res.json(estatistic);
  }

  /**
   * @swagger
   * /student-statistics/measures/{student_id}:
   *   get:
   *     summary: Get student's body measurements
   *     tags: [Student Statistics]
   *     description: Returns all body measures organized by date
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID do cliente
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Medidas corporais do cliente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MedidasResponse'
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getMedidas(req: Request, res: Response): Promise<Response> {
    const { student_id } = req.params as any;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !student_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistics = await knex("student_statistics")
      .select(
        "id",
        "shoulder",
        "chest",
        "left_arm",
        "right_arm",
        "left_forearm",
        "right_forearm",
        "wrist",
        "waist",
        "abdomen",
        "hip",
        "left_thigh",
        "right_thigh",
        "left_calf",
        "right_calf",
        "created_at"
      )
      .where({ student_id, admin_id })
      .orderBy("created_at", "desc");
    
    const medidas = estatistics.map(stat => ({
      id: stat.id,
      data: stat.created_at,
      medidas: {
        shoulder: stat.shoulder,
        chest: stat.chest,
        arms: {
          left: stat.left_arm,
          right: stat.right_arm
        },
        forearms: {
          left: stat.left_forearm,
          right: stat.right_forearm
        },
        wrist: stat.wrist,
        waist: stat.waist,
        abdomen: stat.abdomen,
        hip: stat.hip,
        thighs: {
          left: stat.left_thigh,
          right: stat.right_thigh
        },
        calves: {
          left: stat.left_calf,
          right: stat.right_calf
        }
      }
    }));

    return res.json({ medidas });
  }
}

export default new ClienteEstatisticController();
