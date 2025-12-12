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

interface RepetitionData {
  type: RepType;
  data: any;
}

interface CreateExerciseDTO {
  name: string;
  trainer_id?: number;
  muscle_group?: string;
  equipment?: string;
  video_url?: string;
  image_url?: string;
  favorites?: boolean;
  repetition?: RepetitionData;
}

interface UpdateExerciseDTO {
  name?: string;
  trainer_id?: number;
  muscle_group?: string;
  equipment?: string;
  video_url?: string;
  image_url?: string;
  favorites?: boolean;
  repetitions?: number;
}

interface ExerciseQueryParams {
  term?: string;
  trainer_id?: string;
}

class ExercisesController {
  /**
   * @swagger
   * /exercises:
   *   post:
   *     summary: Create exercise
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
   *             type: object
   *             required: [name]
   *             properties:
   *               name:
   *                 type: string
   *               trainer_id:
   *                 type: integer
   *                 nullable: true
   *               muscle_group:
   *                 type: string
   *                 nullable: true
   *               equipment:
   *                 type: string
   *                 nullable: true
   *               video_url:
   *                 type: string
   *                 nullable: true
   *               image_url:
   *                 type: string
   *                 nullable: true
   *               favorites:
   *                 type: boolean
   *                 default: false
   *               repetitions:
   *                 type: integer
   *                 nullable: true
   *     responses:
   *       201:
   *         description: Exercise created
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, trainer_id, muscle_group, equipment, video_url, image_url, favorites, repetition } = req.body as CreateExerciseDTO;
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

    if (trainer_id) {
      const treinador = await knex("trainers")
        .where({ id: trainer_id, admin_id })
        .first();
      
      if (!treinador) {
        throw new AppError("Treinador não encontrado", 404);
      }
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [exercise] = await knex("exercises")
      .insert({
        trainer_id: trainer_id || null,
        name,
        muscle_group: muscle_group || null,
        equipment: equipment || null,
        video_url: video_url || null,
        image_url: image_url || null,
        favorites: favorites !== undefined ? favorites : false,
        created_at: now,
      })
      .returning([
        "id",
        "trainer_id",
        "name",
        "muscle_group",
        "equipment",
        "video_url",
        "image_url",
        "favorites",
        "created_at",
      ]);

    // Criar repetição se fornecida
    let repetitionRecord = null;
    if (repetition && repetition.type && repetition.data) {
      const { type, data } = repetition;
      
      if (!(type in TABLES)) {
        throw new AppError("Tipo de repetição inválido", 400);
      }

      const table = TABLES[type];
      let payload: any = { exercise_id: exercise.id, created_at: now };

      switch (type) {
        case 'reps-load': {
          const { set, reps, load, rest } = data;
          if ([set, reps, load, rest].some((v: any) => v === undefined)) {
            throw new AppError('Campos obrigatórios para reps-load: set, reps, load, rest', 400);
          }
          payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), rest: Number(rest) };
          break;
        }
        case 'reps-load-time': {
          const { reps, load, time } = data;
          if ([reps, load, time].some((v: any) => v === undefined)) {
            throw new AppError('Campos obrigatórios para reps-load-time: reps, load, time', 400);
          }
          payload = { ...payload, reps: Number(reps), load: Number(load), time: Number(time) };
          break;
        }
        case 'complete-set': {
          const { set, reps, load, time, rest } = data;
          if ([set, reps, load, time, rest].some((v: any) => v === undefined)) {
            throw new AppError('Campos obrigatórios para complete-set: set, reps, load, time, rest', 400);
          }
          payload = { ...payload, set: Number(set), reps: Number(reps), load: Number(load), time: Number(time), rest: Number(rest) };
          break;
        }
        case 'reps-time': {
          const { set, reps, time, rest } = data;
          if ([set, reps, time, rest].some((v: any) => v === undefined)) {
            throw new AppError('Campos obrigatórios para reps-time: set, reps, time, rest', 400);
          }
          payload = { ...payload, set: Number(set), reps: Number(reps), time: Number(time), rest: Number(rest) };
          break;
        }
      }

      [repetitionRecord] = await knex(table).insert(payload).returning('*');
    }

    return res.status(201).json({
      exercise,
      repetition: repetitionRecord
    });
  }

  /**
   * @swagger
   * /exercises:
   *   get:
   *     summary: List exercises
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
   *         name: trainer_id
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Exercise list
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   trainer_id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   muscle_group:
   *                     type: string
   *                   equipment:
   *                     type: string
   *                   video_url:
   *                     type: string
   *                   image_url:
   *                     type: string
   *                   favorites:
   *                     type: boolean
   *                   repetitions:
   *                     type: integer
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { term, trainer_id } = req.query as ExerciseQueryParams;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    let exercisesQuery = knex("exercises")
      .select(
        "exercises.id",
        "exercises.trainer_id",
        "exercises.name",
        "exercises.muscle_group",
        "exercises.equipment",
        "exercises.video_url",
        "exercises.image_url",
        "exercises.favorites",
        "exercises.created_at",
        "trainers.name as trainer_name"
      )
      .leftJoin("trainers", "exercises.trainer_id", "trainers.id")
      .where(function() {
        this.where("trainers.admin_id", admin_id).orWhereNull("exercises.trainer_id");
      });

    if (term) {
      exercisesQuery = exercisesQuery.where(function() {
        this.where("exercises.name", "like", `%${term}%`);
      });
    }

    if (trainer_id) {
      exercisesQuery = exercisesQuery.where("exercises.trainer_id", trainer_id);
    }

    const exercises = await exercisesQuery.orderBy("exercises.name", "asc");

    return res.json(exercises);
  }

  /**
   * @swagger
   * /exercises/{id}:
   *   get:
   *     summary: Get exercise by ID
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
        "exercises.trainer_id",
        "exercises.name",
        "exercises.muscle_group",
        "exercises.equipment",
        "exercises.video_url",
        "exercises.image_url",
        "exercises.favorites",
        "exercises.created_at",
        "trainers.name as trainer_name"
      )
      .leftJoin("trainers", "exercises.trainer_id", "trainers.id")
      .where({ "exercises.id": id })
      .andWhere(function() {
        this.where("trainers.admin_id", admin_id).orWhereNull("exercises.trainer_id");
      })
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
   *     summary: Update exercise
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
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               trainer_id:
   *                 type: integer
   *               muscle_group:
   *                 type: string
   *               equipment:
   *                 type: string
   *               video_url:
   *                 type: string
   *               image_url:
   *                 type: string
   *               favorites:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Exercício atualizado com sucesso
   */
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { name, trainer_id, muscle_group, equipment, video_url, image_url, favorites } = req.body as UpdateExerciseDTO;
      const admin_id = req.headers.admin_id as string;

      console.log('Update request body:', req.body);
      console.log('Update params:', { id, admin_id });

      if (!admin_id) {
        throw new AppError("É necessário enviar o ID do admin", 400);
      }

      const exercise = await knex("exercises").where({ id }).first();

      if (!exercise) {
        throw new AppError("Exercício não encontrado", 404);
      }

      if (trainer_id) {
        const treinador = await knex("trainers")
          .where({ id: trainer_id, admin_id })
          .first();
        
        if (!treinador) {
          throw new AppError("Treinador não encontrado", 404);
        }
      }

      const updatedData: any = {
        name: name || exercise.name,
        trainer_id: trainer_id !== undefined ? trainer_id : exercise.trainer_id,
        muscle_group: muscle_group !== undefined ? muscle_group : exercise.muscle_group,
        equipment: equipment !== undefined ? equipment : exercise.equipment,
        video_url: video_url !== undefined ? video_url : exercise.video_url,
        image_url: image_url !== undefined ? image_url : exercise.image_url,
        favorites: favorites !== undefined ? favorites : exercise.favorites,
      };

      console.log('Updated data:', updatedData);

      await knex("exercises").update(updatedData).where({ id });

      const updatedExercise = await knex("exercises")
        .select(
          "exercises.id",
          "exercises.trainer_id",
          "exercises.name",
          "exercises.muscle_group",
          "exercises.equipment",
          "exercises.video_url",
          "exercises.image_url",
          "exercises.favorites",
          "exercises.created_at",
          "trainers.name as trainer_name"
        )
        .leftJoin("trainers", "exercises.trainer_id", "trainers.id")
        .where({ "exercises.id": id })
        .andWhere(function() {
          this.where("trainers.admin_id", admin_id).orWhereNull("exercises.trainer_id");
        })
        .first();

      return res.status(200).json({
        message: "Exercício atualizado com sucesso",
        exercise: updatedExercise
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  }

  /**
   * @swagger
   * /exercises/{id}:
   *   delete:
   *     summary: Delete exercise
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

    const exercise = await knex("exercises")
      .leftJoin("trainers", "exercises.trainer_id", "trainers.id")
      .where({ "exercises.id": id })
      .andWhere(function() {
        this.where("trainers.admin_id", admin_id).orWhereNull("exercises.trainer_id");
      })
      .first();
    
    if (!exercise) {
      throw new AppError("Exercício não encontrado", 404);
    }
    
    await knex("exercises").where({ id }).delete();
    
    return res.json({ message: "Exercício excluído com sucesso" });
  }
}

export default new ExercisesController();
