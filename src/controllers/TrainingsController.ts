import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateTrainingDTO {
  name: string;
  notes?: string;
  day_of_week?: string;
  trainer_id: number;
  is_library?: boolean;
}

interface UpdateTrainingDTO {
  name?: string;
  notes?: string;
  day_of_week?: string;
  trainer_id?: number;
}

interface TrainingQueryParams {
  term?: string;
  trainer_id?: string;
  is_library?: string;
}

class TrainingsController {
  /**
   * @swagger
   * /trainings:
   *   post:
   *     summary: Create training
   *     tags: [Trainings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, trainer_id]
   *             properties:
   *               name:
   *                 type: string
   *               notes:
   *                 type: string
   *                 nullable: true
   *               day_of_week:
   *                 type: string
   *                 nullable: true
   *               trainer_id:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Treino criado com sucesso
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, notes, day_of_week, trainer_id, is_library } = req.body as CreateTrainingDTO;
    const admin_id = req.headers.admin_id as string || '1';

    if (!name) {
      throw new AppError("Nome do treino é obrigatório", 400);
    }

    if (!trainer_id) {
      throw new AppError("ID do treinador é obrigatório", 400);
    }

    const treinador = await knex("trainers")
      .where({ id: trainer_id, admin_id })
      .first();
    
    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [training] = await knex("trainings")
      .insert({
        trainer_id,
        name,
        day_of_week: day_of_week || null,
        notes: notes || null,
        is_library: is_library !== undefined ? is_library : false,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "trainer_id",
        "name",
        "day_of_week",
        "notes",
        "created_at",
        "updated_at",
        "is_library",
      ]);

    return res.status(201).json(training);
  }

  /**
   * @swagger
   * /trainings:
   *   get:
   *     summary: List trainings
   *     tags: [Trainings]
   *     parameters:
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
   *         description: Lista de treinos
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string || '1';
    const { term, trainer_id, is_library } = req.query as TrainingQueryParams;

    let trainingsQuery = knex("trainings")
      .select(
        "trainings.id",
        "trainings.trainer_id",
        "trainings.name",
        "trainings.day_of_week",
        "trainings.notes",
        "trainings.created_at",
        "trainings.updated_at",
        "trainers.name as trainer_name"
      )
      .leftJoin("trainers", "trainings.trainer_id", "trainers.id")
      .where("trainers.admin_id", admin_id);

    if (trainer_id) {
      trainingsQuery = trainingsQuery.where("trainings.trainer_id", trainer_id);
    }

    if (is_library !== undefined) {
      const flag = is_library === 'true' ? true : is_library === 'false' ? false : undefined;
      if (flag !== undefined) trainingsQuery = trainingsQuery.where("trainings.is_library", flag);
    }

    if (term) {
      trainingsQuery = trainingsQuery.where(function() {
        this.where("trainings.name", "like", `%${term}%`)
          .orWhere("trainings.notes", "like", `%${term}%`);
      });
    }

    const trainings = await trainingsQuery.orderBy("trainings.name", "asc");

    return res.json(trainings);
  }

  /**
   * @swagger
   * /trainings/{id}:
   *   get:
   *     summary: Get training by ID
   *     tags: [Trainings]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Treino encontrado
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string || '1';

    if (!id) {
      throw new AppError("É necessário enviar o ID do treino", 400);
    }

    const training = await knex("trainings")
      .select(
        "trainings.id",
        "trainings.trainer_id",
        "trainings.name",
        "trainings.day_of_week",
        "trainings.notes",
        "trainings.is_library",
        "trainings.created_at",
        "trainings.updated_at",
        "trainers.name as trainer_name"
      )
      .leftJoin("trainers", "trainings.trainer_id", "trainers.id")
      .where({ "trainings.id": id })
      .andWhere("trainers.admin_id", admin_id)
      .first();
    
    if (!training) {
      throw new AppError("Treino não encontrado", 404);
    }
    
    return res.json(training);
  }

  /**
   * @swagger
   * /trainings/{id}:
   *   put:
   *     summary: Update training
   *     tags: [Trainings]
   *     parameters:
   *       - in: path
   *         name: id
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
   *               notes:
   *                 type: string
   *               day_of_week:
   *                 type: string
   *               trainer_id:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Treino atualizado com sucesso
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, notes, day_of_week, trainer_id } = req.body as UpdateTrainingDTO;
    const admin_id = req.headers.admin_id as string || '1';

    const training = await knex("trainings").where({ id }).first();

    if (!training) {
      throw new AppError("Treino não encontrado", 404);
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
      name: name || training.name,
      day_of_week: day_of_week !== undefined ? day_of_week : training.day_of_week,
      notes: notes !== undefined ? notes : training.notes,
      trainer_id: trainer_id !== undefined ? trainer_id : training.trainer_id,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    await knex("trainings").update(updatedData).where({ id });

    const updatedTraining = await knex("trainings")
      .select(
        "trainings.id",
        "trainings.trainer_id",
        "trainings.name",
        "trainings.day_of_week",
        "trainings.notes",
        "trainings.created_at",
        "trainings.updated_at",
        "trainers.name as trainer_name"
      )
      .leftJoin("trainers", "trainings.trainer_id", "trainers.id")
      .where({ "trainings.id": id })
      .andWhere("trainers.admin_id", admin_id)
      .first();

    return res.status(200).json({
      message: "Treino atualizado com sucesso",
      training: updatedTraining
    });
  }

  /**
   * @swagger
   * /trainings/{id}:
   *   delete:
   *     summary: Delete training
   *     tags: [Trainings]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Treino excluído com sucesso
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string || '1';

    if (!id) {
      throw new AppError("É necessário enviar o ID do treino", 400);
    }

    const training = await knex("trainings")
      .leftJoin("trainers", "trainings.trainer_id", "trainers.id")
      .where({ "trainings.id": id })
      .andWhere("trainers.admin_id", admin_id)
      .first();
    
    if (!training) {
      throw new AppError("Treino não encontrado", 404);
    }
    
    await knex("trainings").where({ id }).delete();
    
    return res.json({ message: "Treino excluído com sucesso" });
  }
}

export default new TrainingsController();
