import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateTreinadorDTO {
  name: string;
  email: string;
  password: string;
  document: string;
  phone_number: string;
  position?: string;
}

interface UpdateTreinadorDTO {
  name?: string;
  email?: string;
  document?: string;
  phone_number?: string;
  position?: string;
  password?: string;
}

interface TreinadorQueryParams {
  term?: string;
}

class TreinadoresController {
  /**
   * @swagger
   * /treinadores:
   *   post:
   *     summary: Criar novo treinador
   *     tags: [Treinadores]
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
   *             required: [name, email, password, document, phone_number]
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               document:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               position:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       201:
   *         description: Treinador criado com sucesso
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, email, password, document, phone_number, position } = req.body as CreateTreinadorDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("O ID do admin é obrigatório", 400);
    }

    if (!name || !email || !password || !document || !phone_number) {
      throw new AppError("Todos os campos obrigatórios devem ser preenchidos", 400);
    }

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) {
      throw new AppError("Admin não encontrado", 404);
    }

    const emailUsed = await knex("treinadores")
      .where({ email, admin_id })
      .first();

    if (emailUsed) {
      throw new AppError("Este e-mail já está cadastrado", 400);
    }

    const documentUsed = await knex("treinadores")
      .where({ document, admin_id })
      .first();

    if (documentUsed) {
      throw new AppError("Este documento já está cadastrado", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [treinador] = await knex("treinadores")
      .insert({
        admin_id,
        name,
        email,
        password: hashedPassword,
        document,
        phone_number,
        position: position || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "name",
        "email",
        "document",
        "phone_number",
        "position",
        "created_at",
        "updated_at",
      ]);

    return res.status(201).json(treinador);
  }

  /**
   * @swagger
   * /treinadores:
   *   get:
   *     summary: Listar todos os treinadores
   *     tags: [Treinadores]
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
   *     responses:
   *       200:
   *         description: Lista de treinadores
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { term } = req.query as TreinadorQueryParams;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    let treinadoresQuery = knex("treinadores")
      .select(
        "id",
        "admin_id",
        "name",
        "email",
        "document",
        "phone_number",
        "position",
        "created_at",
        "updated_at"
      )
      .where("admin_id", admin_id);

    if (term) {
      treinadoresQuery = treinadoresQuery.where(function() {
        this.where("name", "like", `%${term}%`)
          .orWhere("email", "like", `%${term}%`)
          .orWhere("document", "like", `%${term}%`);
      });
    }

    const treinadores = await treinadoresQuery.orderBy("name", "asc");

    return res.json(treinadores);
  }

  /**
   * @swagger
   * /treinadores/{id}:
   *   get:
   *     summary: Buscar treinador por ID
   *     tags: [Treinadores]
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
   *         description: Treinador encontrado
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id) {
      throw new AppError("É necessário enviar o ID do treinador", 400);
    }

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const treinador = await knex("treinadores")
      .select(
        "id",
        "admin_id",
        "name",
        "email",
        "document",
        "phone_number",
        "position",
        "created_at",
        "updated_at"
      )
      .where({ id, admin_id })
      .first();
    
    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }
    
    return res.json(treinador);
  }

  /**
   * @swagger
   * /treinadores/{id}:
   *   put:
   *     summary: Atualizar treinador
   *     tags: [Treinadores]
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
   *               email:
   *                 type: string
   *               document:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               position:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Treinador atualizado com sucesso
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, email, document, phone_number, position, password } = req.body as UpdateTreinadorDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const treinador = await knex("treinadores").where({ id, admin_id }).first();

    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }

    if (email && email !== treinador.email) {
      const existingTreinadorWithEmail = await knex("treinadores")
        .where({ email, admin_id })
        .andWhereNot({ id })
        .first();

      if (existingTreinadorWithEmail) {
        throw new AppError("Este e-mail já está cadastrado", 400);
      }
    }

    if (document && document !== treinador.document) {
      const existingTreinadorWithDocument = await knex("treinadores")
        .where({ document, admin_id })
        .andWhereNot({ id })
        .first();

      if (existingTreinadorWithDocument) {
        throw new AppError("Este documento já está cadastrado", 400);
      }
    }

    const updatedData: any = {
      name: name || treinador.name,
      email: email || treinador.email,
      document: document || treinador.document,
      phone_number: phone_number || treinador.phone_number,
      position: position !== undefined ? position : treinador.position,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    if (password) {
      updatedData.password = await bcrypt.hash(password, 8);
    }

    await knex("treinadores").update(updatedData).where({ id, admin_id });

    const updatedTreinador = await knex("treinadores")
      .select(
        "id",
        "admin_id",
        "name",
        "email",
        "document",
        "phone_number",
        "position",
        "created_at",
        "updated_at"
      )
      .where({ id, admin_id })
      .first();

    return res.status(200).json({
      message: "Treinador atualizado com sucesso",
      treinador: updatedTreinador
    });
  }

  /**
   * @swagger
   * /treinadores/{id}:
   *   delete:
   *     summary: Excluir treinador
   *     tags: [Treinadores]
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
   *         description: Treinador excluído com sucesso
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) {
      throw new AppError("É necessário enviar o ID do admin e do treinador", 400);
    }

    const treinador = await knex("treinadores").where({ id, admin_id }).first();
    
    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }
    
    await knex("treinadores").where({ id, admin_id }).delete();
    
    return res.json({ message: "Treinador excluído com sucesso" });
  }
}

export default new TreinadoresController();
