import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateExerciseDTO {
  name: string;
  repetitions?: string;
  series?: string;
  carga?: string;
  notes?: string;
  treinador_id?: number;
}

interface UpdateExerciseDTO {
  name?: string;
  repetitions?: string;
  series?: string;
  carga?: string;
  notes?: string;
  treinador_id?: number;
}

interface ExerciseQueryParams {
  term?: string;
  treinador_id?: string;
}

class ExercisesController {
  /**
   * @swagger
   * /exercises:
   *   post:
   *     summary: Criar novo exercício
   *     tags: [Exercises]
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
   *             $ref: '#/components/schemas/CreateExerciseDTO'
   *     responses:
   *       201:
   *         description: Exercício criado com sucesso
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, repetitions, series, carga, notes, treinador_id } = req.body as CreateExerciseDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("O ID do admin é obrigatório", 400);
    }

    if (!name) {
      throw new AppError("Nome do exercício é obrigatório", 400);
    }

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) {
      throw new AppError("Admin não encontrado", 404);
    }

    if (treinador_id) {
      const treinador = await knex("treinadores")
        .where({ id: treinador_id, admin_id })
        .first();
      
      if (!treinador) {
        throw new AppError("Treinador não encontrado", 404);
      }
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [exercise] = await knex("exercises")
      .insert({
        admin_id,
        treinador_id: treinador_id || null,
        name,
        repetitions: repetitions || null,
        series: series || null,
        carga: carga || null,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "treinador_id",
        "name",
        "repetitions",
        "series",
        "carga",
        "notes",
        "created_at",
        "updated_at",
      ]);

    return res.status(201).json(exercise);
  }

  /**
   * @swagger
   * /exercises:
   *   get:
   *     summary: Listar todos os exercícios
   *     tags: [Exercises]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: term
   *         schema:
   *           type: string
   *       - in: query
   *         name: treinador_id
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de exercícios
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { term, treinador_id } = req.query as ExerciseQueryParams;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    let exercisesQuery = knex("exercises")
      .select(
        "exercises.id",
        "exercises.admin_id",
        "exercises.treinador_id",
        "exercises.name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes",
        "exercises.created_at",
        "exercises.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "exercises.treinador_id", "treinadores.id")
      .where("exercises.admin_id", admin_id);

    if (term) {
      exercisesQuery = exercisesQuery.where(function() {
        this.where("exercises.name", "like", `%${term}%`)
          .orWhere("exercises.notes", "like", `%${term}%`);
      });
    }

    if (treinador_id) {
      exercisesQuery = exercisesQuery.where("exercises.treinador_id", treinador_id);
    }

    const exercises = await exercisesQuery.orderBy("exercises.name", "asc");

    return res.json(exercises);
  }

  /**
   * @swagger
   * /exercises/{id}:
   *   get:
   *     summary: Buscar exercício por ID
   *     tags: [Exercises]
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
   *         description: Exercício encontrado
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id) {
      throw new AppError("É necessário enviar o ID do exercício", 400);
    }

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const exercise = await knex("exercises")
      .select(
        "exercises.id",
        "exercises.admin_id",
        "exercises.treinador_id",
        "exercises.name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes",
        "exercises.created_at",
        "exercises.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "exercises.treinador_id", "treinadores.id")
      .where({ "exercises.id": id, "exercises.admin_id": admin_id })
      .first();
    
    if (!exercise) {
      throw new AppError("Exercício não encontrado", 404);
    }
    
    return res.json(exercise);
  }

  /**
   * @swagger
   * /exercises/{id}:
   *   put:
   *     summary: Atualizar exercício
   *     tags: [Exercises]
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
   *             $ref: '#/components/schemas/UpdateExerciseDTO'
   *     responses:
   *       200:
   *         description: Exercício atualizado com sucesso
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, repetitions, series, carga, notes, treinador_id } = req.body as UpdateExerciseDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const exercise = await knex("exercises").where({ id, admin_id }).first();

    if (!exercise) {
      throw new AppError("Exercício não encontrado", 404);
    }

    if (treinador_id) {
      const treinador = await knex("treinadores")
        .where({ id: treinador_id, admin_id })
        .first();
      
      if (!treinador) {
        throw new AppError("Treinador não encontrado", 404);
      }
    }

    const updatedData: any = {
      name: name || exercise.name,
      repetitions: repetitions !== undefined ? repetitions : exercise.repetitions,
      series: series !== undefined ? series : exercise.series,
      carga: carga !== undefined ? carga : exercise.carga,
      notes: notes !== undefined ? notes : exercise.notes,
      treinador_id: treinador_id !== undefined ? treinador_id : exercise.treinador_id,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    await knex("exercises").update(updatedData).where({ id, admin_id });

    const updatedExercise = await knex("exercises")
      .select(
        "exercises.id",
        "exercises.admin_id",
        "exercises.treinador_id",
        "exercises.name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes",
        "exercises.created_at",
        "exercises.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "exercises.treinador_id", "treinadores.id")
      .where({ "exercises.id": id, "exercises.admin_id": admin_id })
      .first();

    return res.status(200).json({
      message: "Exercício atualizado com sucesso",
      exercise: updatedExercise
    });
  }

  /**
   * @swagger
   * /exercises/{id}:
   *   delete:
   *     summary: Excluir exercício
   *     tags: [Exercises]
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
   *         description: Exercício excluído com sucesso
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) {
      throw new AppError("É necessário enviar o ID do admin e do exercício", 400);
    }

    const exercise = await knex("exercises").where({ id, admin_id }).first();
    
    if (!exercise) {
      throw new AppError("Exercício não encontrado", 404);
    }
    
    await knex("exercises").where({ id, admin_id }).delete();
    
    return res.json({ message: "Exercício excluído com sucesso" });
  }
}

export default new ExercisesController();
