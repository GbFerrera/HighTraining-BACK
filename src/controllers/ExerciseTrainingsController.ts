import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateExerciseTrainingDTO {
  training_id: number;
  exercise_id: number;
  video_url?: string;
  sets?: number;
  reps?: number;
  rest_time?: number;
  order?: number;
  notes?: string;
}

interface ExerciseTrainingQueryParams {
  training_id?: string;
  exercise_id?: string;
}

class ExerciseTrainingsController {
  /**
   * @swagger
   * /exercise-trainings:
   *   post:
   *     summary: Vincular exercício a treino
   *     tags: [ExerciseTrainings]
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
   *             required: [training_id, exercise_id]
   *             properties:
   *               training_id:
   *                 type: integer
   *               exercise_id:
   *                 type: integer
   *               video_url:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       201:
   *         description: Exercício vinculado ao treino com sucesso
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { training_id, exercise_id, video_url, sets, reps, rest_time, order, notes } = req.body as CreateExerciseTrainingDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("O ID do admin é obrigatório", 400);
    }

    if (!training_id || !exercise_id) {
      throw new AppError("ID do treino e do exercício são obrigatórios", 400);
    }

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) {
      throw new AppError("Admin não encontrado", 404);
    }

    const training = await knex("trainings")
      .where({ id: training_id, admin_id })
      .first();
    
    if (!training) {
      throw new AppError("Treino não encontrado", 404);
    }

    const exercise = await knex("exercises")
      .where({ id: exercise_id, admin_id })
      .first();
    
    if (!exercise) {
      throw new AppError("Exercício não encontrado", 404);
    }

    const existingRelation = await knex("exercise_trainings")
      .where({ training_id, exercise_id, admin_id })
      .first();

    if (existingRelation) {
      throw new AppError("Este exercício já está vinculado a este treino", 400);
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [exerciseTraining] = await knex("exercise_trainings")
      .insert({
        admin_id,
        training_id,
        exercise_id,
        video_url: video_url || null,
        sets: sets || null,
        reps: reps || null,
        rest_time: rest_time || null,
        order: order || null,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "training_id",
        "exercise_id",
        "video_url",
        "sets",
        "reps",
        "rest_time",
        "order",
        "notes",
        "created_at",
        "updated_at",
      ]);

    return res.status(201).json(exerciseTraining);
  }

  /**
   * @swagger
   * /exercise-trainings:
   *   get:
   *     summary: Listar vínculos exercício-treino
   *     tags: [ExerciseTrainings]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: training_id
   *         schema:
   *           type: integer
   *       - in: query
   *         name: exercise_id
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de vínculos
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { training_id, exercise_id } = req.query as ExerciseTrainingQueryParams;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    let exerciseTrainingsQuery = knex("exercise_trainings")
      .select(
        "exercise_trainings.id",
        "exercise_trainings.admin_id",
        "exercise_trainings.training_id",
        "exercise_trainings.exercise_id",
        "exercise_trainings.video_url",
        "exercise_trainings.sets",
        "exercise_trainings.reps",
        "exercise_trainings.rest_time",
        "exercise_trainings.order",
        "exercise_trainings.notes",
        "exercise_trainings.created_at",
        "exercise_trainings.updated_at",
        "trainings.name as training_name",
        "exercises.name as exercise_name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes as exercise_notes"
      )
      .leftJoin("trainings", "exercise_trainings.training_id", "trainings.id")
      .leftJoin("exercises", "exercise_trainings.exercise_id", "exercises.id")
      .where("exercise_trainings.admin_id", admin_id);

    if (training_id) {
      exerciseTrainingsQuery = exerciseTrainingsQuery.where("exercise_trainings.training_id", training_id);
    }

    if (exercise_id) {
      exerciseTrainingsQuery = exerciseTrainingsQuery.where("exercise_trainings.exercise_id", exercise_id);
    }

    const exerciseTrainings = await exerciseTrainingsQuery.orderBy("exercise_trainings.created_at", "desc");

    return res.json(exerciseTrainings);
  }

  /**
   * @swagger
   * /exercise-trainings/{id}:
   *   get:
   *     summary: Buscar vínculo por ID
   *     tags: [ExerciseTrainings]
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
   *     responses:
   *       200:
   *         description: Vínculo encontrado
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id) {
      throw new AppError("É necessário enviar o ID", 400);
    }

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const exerciseTraining = await knex("exercise_trainings")
      .select(
        "exercise_trainings.id",
        "exercise_trainings.admin_id",
        "exercise_trainings.training_id",
        "exercise_trainings.exercise_id",
        "exercise_trainings.video_url",
        "exercise_trainings.sets",
        "exercise_trainings.reps",
        "exercise_trainings.rest_time",
        "exercise_trainings.order",
        "exercise_trainings.notes",
        "exercise_trainings.created_at",
        "exercise_trainings.updated_at",
        "trainings.name as training_name",
        "exercises.name as exercise_name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes as exercise_notes"
      )
      .leftJoin("trainings", "exercise_trainings.training_id", "trainings.id")
      .leftJoin("exercises", "exercise_trainings.exercise_id", "exercises.id")
      .where({ "exercise_trainings.id": id, "exercise_trainings.admin_id": admin_id })
      .first();
    
    if (!exerciseTraining) {
      throw new AppError("Registro não encontrado", 404);
    }
    
    return res.json(exerciseTraining);
  }

  /**
   * @swagger
   * /exercise-trainings/{id}:
   *   delete:
   *     summary: Remover exercício do treino
   *     tags: [ExerciseTrainings]
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
   *     responses:
   *       200:
   *         description: Exercício removido do treino
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) {
      throw new AppError("É necessário enviar o ID do admin e do registro", 400);
    }

    const exerciseTraining = await knex("exercise_trainings").where({ id, admin_id }).first();
    
    if (!exerciseTraining) {
      throw new AppError("Registro não encontrado", 404);
    }
    
    await knex("exercise_trainings").where({ id, admin_id }).delete();
    
    return res.json({ message: "Exercício removido do treino com sucesso" });
  }

  /**
   * @swagger
   * /exercise-trainings/training/{training_id}:
   *   get:
   *     summary: Buscar exercícios de um treino
   *     tags: [ExerciseTrainings]
   *     parameters:
   *       - in: path
   *         name: training_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de exercícios do treino
   */
  async getByTraining(req: Request, res: Response): Promise<Response> {
    const { training_id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    if (!training_id) {
      throw new AppError("É necessário enviar o ID do treino", 400);
    }

    const exercises = await knex("exercise_trainings")
      .select(
        "exercise_trainings.id",
        "exercise_trainings.admin_id",
        "exercise_trainings.training_id",
        "exercise_trainings.exercise_id",
        "exercise_trainings.video_url",
        "exercise_trainings.sets",
        "exercise_trainings.reps",
        "exercise_trainings.rest_time",
        "exercise_trainings.order",
        "exercise_trainings.notes",
        "exercise_trainings.created_at",
        "exercise_trainings.updated_at",
        "exercises.name as exercise_name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes as exercise_notes"
      )
      .leftJoin("exercises", "exercise_trainings.exercise_id", "exercises.id")
      .where({ "exercise_trainings.training_id": training_id, "exercise_trainings.admin_id": admin_id })
      .orderBy("exercise_trainings.order", "asc")
      .orderBy("exercises.name", "asc");
    
    return res.json(exercises);
  }
}

export default new ExerciseTrainingsController();
