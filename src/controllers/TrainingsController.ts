import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateTrainingDTO {
  name: string;
  duration?: string;
  repeticoes?: string;
  video_url?: string;
  carga?: string;
  notes?: string;
  treinador_id?: number;
}

interface UpdateTrainingDTO {
  name?: string;
  duration?: string;
  repeticoes?: string;
  video_url?: string;
  carga?: string;
  notes?: string;
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
   *               duration:
   *                 type: string
   *                 nullable: true
   *               repeticoes:
   *                 type: string
   *                 nullable: true
   *               video_url:
   *                 type: string
   *                 nullable: true
   *               carga:
   *                 type: string
   *                 nullable: true
   *               notes:
   *                 type: string
   *                 nullable: true
   *               treinador_id:
   *                 type: integer
   *                 nullable: true
   *     responses:
   *       201:
   *         description: Treino criado com sucesso
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, duration, repeticoes, video_url, carga, notes, treinador_id } = req.body as CreateTrainingDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("O ID do admin é obrigatório", 400);
    }

    if (!name) {
      throw new AppError("Nome do treino é obrigatório", 400);
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

    const [training] = await knex("trainings")
      .insert({
        admin_id,
        treinador_id: treinador_id || null,
        name,
        duration: duration || null,
        repeticoes: repeticoes || null,
        video_url: video_url || null,
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
        "duration",
        "repeticoes",
        "video_url",
        "carga",
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
   *         description: Lista de treinos
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { term, treinador_id } = req.query as TrainingQueryParams;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    let trainingsQuery = knex("trainings")
      .select(
        "trainings.id",
        "trainings.admin_id",
        "trainings.treinador_id",
        "trainings.name",
        "trainings.duration",
        "trainings.repeticoes",
        "trainings.video_url",
        "trainings.carga",
        "trainings.notes",
        "trainings.created_at",
        "trainings.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "trainings.treinador_id", "treinadores.id")
      .where("trainings.admin_id", admin_id);

    if (term) {
      trainingsQuery = trainingsQuery.where(function() {
        this.where("trainings.name", "like", `%${term}%`)
          .orWhere("trainings.notes", "like", `%${term}%`);
      });
    }

    if (treinador_id) {
      trainingsQuery = trainingsQuery.where("trainings.treinador_id", treinador_id);
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
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Treino encontrado
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id) {
      throw new AppError("É necessário enviar o ID do treino", 400);
    }

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const training = await knex("trainings")
      .select(
        "trainings.id",
        "trainings.admin_id",
        "trainings.treinador_id",
        "trainings.name",
        "trainings.duration",
        "trainings.repeticoes",
        "trainings.video_url",
        "trainings.carga",
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
   *               duration:
   *                 type: string
   *               repeticoes:
   *                 type: string
   *               video_url:
   *                 type: string
   *               carga:
   *                 type: string
   *               notes:
   *                 type: string
   *               treinador_id:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Treino atualizado com sucesso
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, duration, repeticoes, video_url, carga, notes, treinador_id } = req.body as UpdateTrainingDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const training = await knex("trainings").where({ id, admin_id }).first();

    if (!training) {
      throw new AppError("Treino não encontrado", 404);
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
      name: name || training.name,
      duration: duration !== undefined ? duration : training.duration,
      repeticoes: repeticoes !== undefined ? repeticoes : training.repeticoes,
      video_url: video_url !== undefined ? video_url : training.video_url,
      carga: carga !== undefined ? carga : training.carga,
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
        "trainings.duration",
        "trainings.repeticoes",
        "trainings.video_url",
        "trainings.carga",
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
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Treino excluído com sucesso
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) {
      throw new AppError("É necessário enviar o ID do admin e do treino", 400);
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
