import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateTrainingDTO {
  name: string;
  notes?: string;
  day_of_week?: string;
  treinador_id: number;
}

interface UpdateTrainingDTO {
  name?: string;
  notes?: string;
  day_of_week?: string;
  treinador_id?: number;
}

interface TrainingQueryParams {
  term?: string;
  treinador_id?: string;
}

class TrainingsController {
  /**
   * @swagger
   * /trainings:
   *   post:
   *     summary: Criar novo treino
   *     tags: [Trainings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, treinador_id]
   *             properties:
   *               name:
   *                 type: string
   *               notes:
   *                 type: string
   *                 nullable: true
   *               day_of_week:
   *                 type: string
   *                 nullable: true
   *               treinador_id:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Treino criado com sucesso
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, notes, day_of_week, treinador_id } = req.body as CreateTrainingDTO;
    const admin_id = req.headers.admin_id as string || '1';

    if (!name) {
      throw new AppError("Nome do treino é obrigatório", 400);
    }

    if (!treinador_id) {
      throw new AppError("ID do treinador é obrigatório", 400);
    }

    const treinador = await knex("treinadores")
      .where({ id: treinador_id })
      .first();
    
    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [training] = await knex("trainings")
      .insert({
        admin_id,
        treinador_id,
        name,
        day_of_week: day_of_week || null,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "treinador_id",
        "name",
        "day_of_week",
        "notes",
        "created_at",
        "updated_at",
      ]);

    return res.status(201).json(training);
  }

  /**
   * @swagger
   * /trainings:
   *   get:
   *     summary: Listar todos os treinos
   *     tags: [Trainings]
   *     parameters:
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
   *         description: Lista de treinos
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string || '1';
    const { term, treinador_id } = req.query as TrainingQueryParams;

    if (!treinador_id) {
      throw new AppError("É necessário enviar o ID do treinador", 400);
    }

    let trainingsQuery = knex("trainings")
      .select(
        "trainings.id",
        "trainings.admin_id",
        "trainings.treinador_id",
        "trainings.name",
        "trainings.day_of_week",
        "trainings.notes",
        "trainings.created_at",
        "trainings.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "trainings.treinador_id", "treinadores.id")
      .where("trainings.admin_id", admin_id)
      .where("trainings.treinador_id", treinador_id);

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
   *     summary: Buscar treino por ID
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
        "trainings.admin_id",
        "trainings.treinador_id",
        "trainings.name",
        "trainings.day_of_week",
        "trainings.notes",
        "trainings.created_at",
        "trainings.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "trainings.treinador_id", "treinadores.id")
      .where({ "trainings.id": id, "trainings.admin_id": admin_id })
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
   *     summary: Atualizar treino
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
   *               treinador_id:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Treino atualizado com sucesso
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, notes, day_of_week, treinador_id } = req.body as UpdateTrainingDTO;
    const admin_id = req.headers.admin_id as string || '1';

    const training = await knex("trainings").where({ id, admin_id }).first();

    if (!training) {
      throw new AppError("Treino não encontrado", 404);
    }

    if (treinador_id) {
      const treinador = await knex("treinadores")
        .where({ id: treinador_id })
        .first();
      
      if (!treinador) {
        throw new AppError("Treinador não encontrado", 404);
      }
    }

    const updatedData: any = {
      name: name || training.name,
      day_of_week: day_of_week !== undefined ? day_of_week : training.day_of_week,
      notes: notes !== undefined ? notes : training.notes,
      treinador_id: treinador_id !== undefined ? treinador_id : training.treinador_id,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    await knex("trainings").update(updatedData).where({ id, admin_id });

    const updatedTraining = await knex("trainings")
      .select(
        "trainings.id",
        "trainings.admin_id",
        "trainings.treinador_id",
        "trainings.name",
        "trainings.day_of_week",
        "trainings.notes",
        "trainings.created_at",
        "trainings.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "trainings.treinador_id", "treinadores.id")
      .where({ "trainings.id": id, "trainings.admin_id": admin_id })
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
   *     summary: Excluir treino
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

    const training = await knex("trainings").where({ id, admin_id }).first();
    
    if (!training) {
      throw new AppError("Treino não encontrado", 404);
    }
    
    await knex("trainings").where({ id, admin_id }).delete();
    
    return res.json({ message: "Treino excluído com sucesso" });
  }
}

export default new TrainingsController();
