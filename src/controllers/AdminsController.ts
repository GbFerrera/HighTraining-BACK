import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import { CreateAdminDTO } from '../types';

interface UpdateAdminDTO {
  name?: string;
  email?: string;
  document?: string;
  phone_number?: string;
  password?: string;
}

interface AdminQueryParams {
  term?: string;
}

class AdminsController {
  /**
   * @swagger
   * /admins:
   *   post:
   *     summary: Criar novo administrador
   *     tags: [Admins]
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
   *                 example: Admin Master
   *               email:
   *                 type: string
   *                 example: admin@email.com
   *               password:
   *                 type: string
   *                 example: senha123
   *               document:
   *                 type: string
   *                 example: 12345678900
   *               phone_number:
   *                 type: string
   *                 example: 11999999999
   *     responses:
   *       201:
   *         description: Admin criado com sucesso
   *       400:
   *         description: Dados inválidos ou já cadastrados
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, email, password, document, phone_number } = req.body as CreateAdminDTO & { document: string; phone_number: string };

    if (!name || !email || !password || !document || !phone_number) {
      throw new AppError("Todos os campos são obrigatórios", 400);
    }

    const emailUsed = await knex("admins").where({ email }).first();
    if (emailUsed) {
      throw new AppError("Este e-mail já está cadastrado", 400);
    }

    const documentUsed = await knex("admins").where({ document }).first();
    if (documentUsed) {
      throw new AppError("Este documento já está cadastrado", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [admin] = await knex("admins")
      .insert({
        name,
        email,
        password: hashedPassword,
        document,
        phone_number,
        created_at: now,
        updated_at: now,
      })
      .returning(["id", "name", "email", "document", "phone_number", "created_at", "updated_at"]);

    return res.status(201).json(admin);
  }

  /**
   * @swagger
   * /admins:
   *   get:
   *     summary: Listar todos os administradores
   *     tags: [Admins]
   *     parameters:
   *       - in: query
   *         name: term
   *         schema:
   *           type: string
   *         description: Termo de busca (nome, email ou documento)
   *     responses:
   *       200:
   *         description: Lista de administradores
   */
  async index(req: Request, res: Response): Promise<Response> {
    const { term } = req.query as AdminQueryParams;

    let adminsQuery = knex("admins")
      .select("id", "name", "email", "document", "phone_number", "created_at", "updated_at");

    if (term) {
      adminsQuery = adminsQuery.where(function() {
        this.where("name", "like", `%${term}%`)
          .orWhere("email", "like", `%${term}%`)
          .orWhere("document", "like", `%${term}%`);
      });
    }

    const admins = await adminsQuery.orderBy("name", "asc");

    return res.json(admins);
  }

  /**
   * @swagger
   * /admins/{id}:
   *   get:
   *     summary: Buscar administrador por ID
   *     tags: [Admins]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Admin encontrado
   *       404:
   *         description: Admin não encontrado
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const admin = await knex("admins")
      .select("id", "name", "email", "document", "phone_number", "created_at", "updated_at")
      .where({ id })
      .first();
    
    if (!admin) {
      throw new AppError("Admin não encontrado", 404);
    }
    
    return res.json(admin);
  }

  /**
   * @swagger
   * /admins/{id}:
   *   put:
   *     summary: Atualizar administrador
   *     tags: [Admins]
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
   *               email:
   *                 type: string
   *               document:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Admin atualizado com sucesso
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, email, document, phone_number, password } = req.body as UpdateAdminDTO;

    const admin = await knex("admins").where({ id }).first();

    if (!admin) {
      throw new AppError("Admin não encontrado", 404);
    }

    if (email && email !== admin.email) {
      const existingAdminWithEmail = await knex("admins")
        .where({ email })
        .andWhereNot({ id })
        .first();

      if (existingAdminWithEmail) {
        throw new AppError("Este e-mail já está cadastrado", 400);
      }
    }

    if (document && document !== admin.document) {
      const existingAdminWithDocument = await knex("admins")
        .where({ document })
        .andWhereNot({ id })
        .first();

      if (existingAdminWithDocument) {
        throw new AppError("Este documento já está cadastrado", 400);
      }
    }

    const updatedData: any = {
      name: name || admin.name,
      email: email || admin.email,
      document: document || admin.document,
      phone_number: phone_number || admin.phone_number,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    if (password) {
      updatedData.password = await bcrypt.hash(password, 8);
    }

    await knex("admins").update(updatedData).where({ id });

    const updatedAdmin = await knex("admins")
      .select("id", "name", "email", "document", "phone_number", "created_at", "updated_at")
      .where({ id })
      .first();

    return res.status(200).json({
      message: "Admin atualizado com sucesso",
      admin: updatedAdmin
    });
  }

  /**
   * @swagger
   * /admins/{id}:
   *   delete:
   *     summary: Excluir administrador
   *     tags: [Admins]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Admin excluído com sucesso
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const admin = await knex("admins").where({ id }).first();
    
    if (!admin) {
      throw new AppError("Admin não encontrado", 404);
    }
    
    await knex("admins").where({ id }).delete();
    
    return res.json({ message: "Admin excluído com sucesso" });
  }
}

export default new AdminsController();
