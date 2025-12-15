import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import { CreateRoutineProgressDTO, UpdateRoutineProgressDTO } from '../types';

interface RoutineProgressQueryParams {
  training_routine_id?: string;
  status?: string;
}

class RoutineProgressController {
  /**
   * @swagger
   * /routine-progress:
   *   post:
   *     summary: Create routine progress
   *     tags: [Routine Progress]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [training_routine_id, status]
   *             properties:
   *               training_routine_id:
   *                 type: integer
   *               status:
   *                 type: string
   *                 enum: [completed, started]
   *     responses:
   *       201:
   *         description: Routine progress created
   *       400:
   *         description: Invalid data
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { training_routine_id, status } = req.body as CreateRoutineProgressDTO;

    if (!training_routine_id || !status) {
      throw new AppError("training_routine_id e status são obrigatórios", 400);
    }

    if (!['completed', 'started'].includes(status)) {
      throw new AppError("Status deve ser 'completed' ou 'started'", 400);
    }

    // Verifica se o training_routine existe
    const trainingRoutine = await knex("training_routines").where({ id: training_routine_id }).first();
    if (!trainingRoutine) {
      throw new AppError("Training routine não encontrado", 404);
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [routineProgress] = await knex("routine_progress")
      .insert({
        training_routine_id,
        status,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "training_routine_id",
        "status",
        "created_at",
        "updated_at",
      ]);

    return res.status(201).json(routineProgress);
  }

  /**
   * @swagger
   * /routine-progress:
   *   get:
   *     summary: List routine progress
   *     tags: [Routine Progress]
   *     parameters:
   *       - in: query
   *         name: training_routine_id
   *         schema:
   *           type: integer
   *         description: Filter by training route ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [completed, started]
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: Routine progress list
   */
  async index(req: Request, res: Response): Promise<Response> {
    const { training_routine_id, status } = req.query as RoutineProgressQueryParams;

    let progressQuery = knex("routine_progress")
      .select(
        "routine_progress.id",
        "routine_progress.training_routine_id",
        "routine_progress.status",
        "routine_progress.created_at",
        "routine_progress.updated_at"
      );

    if (training_routine_id) {
      progressQuery = progressQuery.where("routine_progress.training_routine_id", training_routine_id);
    }

    if (status) {
      progressQuery = progressQuery.where("routine_progress.status", status);
    }

    const routineProgress = await progressQuery.orderBy("routine_progress.created_at", "desc");

    return res.json(routineProgress);
  }

  /**
   * @swagger
   * /routine-progress/{id}:
   *   get:
   *     summary: Get routine progress by ID
   *     tags: [Routine Progress]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Routine progress found
   *       404:
   *         description: Routine progress not found
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) {
      throw new AppError("É necessário enviar o ID do routine progress", 400);
    }

    const routineProgress = await knex("routine_progress")
      .select(
        "id",
        "training_routine_id",
        "status",
        "created_at",
        "updated_at"
      )
      .where({ id })
      .first();
    
    if (!routineProgress) {
      throw new AppError("Routine progress não encontrado", 404);
    }
    
    return res.json(routineProgress);
  }

  /**
   * @swagger
   * /routine-progress/{id}:
   *   put:
   *     summary: Update routine progress
   *     tags: [Routine Progress]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [completed, started]
   *     responses:
   *       200:
   *         description: Routine progress updated
   *       404:
   *         description: Routine progress not found
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { status } = req.body as UpdateRoutineProgressDTO;

    if (!id) {
      throw new AppError("É necessário enviar o ID do routine progress", 400);
    }

    const routineProgress = await knex("routine_progress").where({ id }).first();

    if (!routineProgress) {
      throw new AppError("Routine progress não encontrado", 404);
    }

    if (status && !['completed', 'started'].includes(status)) {
      throw new AppError("Status deve ser 'completed' ou 'started'", 400);
    }

    const updatedData: any = {
      status: status || routineProgress.status,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    await knex("routine_progress").update(updatedData).where({ id });

    const updatedRoutineProgress = await knex("routine_progress")
      .select(
        "id",
        "training_routine_id",
        "status",
        "created_at",
        "updated_at"
      )
      .where({ id })
      .first();

    return res.status(200).json({
      message: "Routine progress atualizado com sucesso",
      routineProgress: updatedRoutineProgress
    });
  }

  /**
   * @swagger
   * /routine-progress/{id}:
   *   delete:
   *     summary: Delete routine progress
   *     tags: [Routine Progress]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Routine progress deleted
   *       404:
   *         description: Routine progress not found
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) {
      throw new AppError("É necessário enviar o ID do routine progress", 400);
    }

    const routineProgress = await knex("routine_progress").where({ id }).first();
    
    if (!routineProgress) {
      throw new AppError("Routine progress não encontrado", 404);
    }
    
    await knex("routine_progress").where({ id }).delete();
    
    return res.json({ message: "Routine progress excluído com sucesso" });
  }
}

export default new RoutineProgressController();
