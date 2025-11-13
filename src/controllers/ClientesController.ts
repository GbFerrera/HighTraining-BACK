import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import { CreateClienteDTO, UpdateClienteDTO, ClienteQueryParams } from '../types';

class ClientesController {
  /**
   * @swagger
   * /clientes:
   *   post:
   *     summary: Criar novo cliente
   *     tags: [Clientes]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateClienteDTO'
   *     responses:
   *       201:
   *         description: Cliente criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Cliente'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Admin ou Treinador não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, email, password, treinador_id, phone_number, date_of_birth, age, gender } = req.body as CreateClienteDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("O ID do admin é obrigatório", 400);
    }

    if (!name || !email || !password) {
      throw new AppError("Nome, e-mail e senha são obrigatórios", 400);
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

    const emailUsed = await knex("clientes")
      .where({ email, admin_id })
      .first();

    if (emailUsed) {
      throw new AppError("Este e-mail já está cadastrado", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [cliente] = await knex("clientes")
      .insert({
        admin_id,
        treinador_id: treinador_id || null,
        name,
        email,
        password: hashedPassword,
        phone_number: phone_number || null,
        date_of_birth: date_of_birth || null,
        age: age || null,
        gender: gender || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "treinador_id",
        "name",
        "email",
        "phone_number",
        "date_of_birth",
        "age",
        "gender",
        "created_at",
        "updated_at",
      ]);

    return res.status(201).json(cliente);
  }

  /**
   * @swagger
   * /clientes:
   *   get:
   *     summary: Listar todos os clientes
   *     tags: [Clientes]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do administrador
   *       - in: query
   *         name: term
   *         schema:
   *           type: string
   *         description: Termo de busca (nome, email ou telefone)
   *       - in: query
   *         name: treinador_id
   *         schema:
   *           type: integer
   *         description: Filtrar por ID do treinador
   *     responses:
   *       200:
   *         description: Lista de clientes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Cliente'
   *       400:
   *         description: Admin ID não fornecido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { term, treinador_id } = req.query as ClienteQueryParams;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    let clientesQuery = knex("clientes")
      .select(
        "clientes.id",
        "clientes.admin_id",
        "clientes.treinador_id",
        "clientes.name",
        "clientes.email",
        "clientes.phone_number",
        "clientes.date_of_birth",
        "clientes.age",
        "clientes.gender",
        "clientes.created_at",
        "clientes.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "clientes.treinador_id", "treinadores.id")
      .where("clientes.admin_id", admin_id);

    if (term) {
      clientesQuery = clientesQuery.where(function() {
        this.where("clientes.name", "like", `%${term}%`)
          .orWhere("clientes.email", "like", `%${term}%`)
          .orWhere("clientes.phone_number", "like", `%${term}%`);
      });
    }

    if (treinador_id) {
      clientesQuery = clientesQuery.where("clientes.treinador_id", treinador_id);
    }

    const clientes = await clientesQuery.orderBy("clientes.name", "asc");

    return res.json(clientes);
  }

  /**
   * @swagger
   * /clientes/{id}:
   *   get:
   *     summary: Buscar cliente por ID
   *     tags: [Clientes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Cliente encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Cliente'
   *       400:
   *         description: Parâmetros inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Cliente não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id) {
      throw new AppError("É necessário enviar o ID do cliente", 400);
    }

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const cliente = await knex("clientes")
      .select(
        "clientes.id",
        "clientes.admin_id",
        "clientes.treinador_id",
        "clientes.name",
        "clientes.email",
        "clientes.phone_number",
        "clientes.date_of_birth",
        "clientes.age",
        "clientes.gender",
        "clientes.created_at",
        "clientes.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "clientes.treinador_id", "treinadores.id")
      .where({ "clientes.id": id, "clientes.admin_id": admin_id })
      .first();
    
    if (!cliente) {
      throw new AppError("Cliente não encontrado", 404);
    }
    
    return res.json(cliente);
  }

  /**
   * @swagger
   * /clientes/{id}:
   *   put:
   *     summary: Atualizar cliente
   *     tags: [Clientes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateClienteDTO'
   *     responses:
   *       200:
   *         description: Cliente atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Cliente atualizado com sucesso
   *                 cliente:
   *                   $ref: '#/components/schemas/Cliente'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Cliente não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, email, password, treinador_id, phone_number, date_of_birth, age, gender } = req.body as UpdateClienteDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const cliente = await knex("clientes").where({ id, admin_id }).first();

    if (!cliente) {
      throw new AppError("Cliente não encontrado", 404);
    }

    if (email && email !== cliente.email) {
      const existingClienteWithEmail = await knex("clientes")
        .where({ email, admin_id })
        .andWhereNot({ id })
        .first();

      if (existingClienteWithEmail) {
        throw new AppError("Este e-mail já está cadastrado", 400);
      }
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
      name: name || cliente.name,
      email: email || cliente.email,
      treinador_id: treinador_id !== undefined ? treinador_id : cliente.treinador_id,
      phone_number: phone_number !== undefined ? phone_number : cliente.phone_number,
      date_of_birth: date_of_birth !== undefined ? date_of_birth : cliente.date_of_birth,
      age: age !== undefined ? age : cliente.age,
      gender: gender !== undefined ? gender : cliente.gender,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    if (password) {
      updatedData.password = await bcrypt.hash(password, 8);
    }

    await knex("clientes").update(updatedData).where({ id, admin_id });

    const updatedCliente = await knex("clientes")
      .select(
        "clientes.id",
        "clientes.admin_id",
        "clientes.treinador_id",
        "clientes.name",
        "clientes.email",
        "clientes.phone_number",
        "clientes.date_of_birth",
        "clientes.age",
        "clientes.gender",
        "clientes.created_at",
        "clientes.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "clientes.treinador_id", "treinadores.id")
      .where({ "clientes.id": id, "clientes.admin_id": admin_id })
      .first();

    return res.status(200).json({
      message: "Cliente atualizado com sucesso",
      cliente: updatedCliente
    });
  }

  /**
   * @swagger
   * /clientes/{id}:
   *   delete:
   *     summary: Excluir cliente
   *     tags: [Clientes]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do cliente
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Cliente excluído com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Cliente excluído com sucesso
   *       400:
   *         description: Parâmetros inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Cliente não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) {
      throw new AppError("É necessário enviar o ID do admin e do cliente", 400);
    }

    const cliente = await knex("clientes").where({ id, admin_id }).first();
    
    if (!cliente) {
      throw new AppError("Cliente não encontrado", 404);
    }
    
    await knex("clientes").where({ id, admin_id }).delete();
    
    return res.json({ message: "Cliente excluído com sucesso" });
  }
}

export default new ClientesController();
