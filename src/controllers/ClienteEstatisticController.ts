import { Request, Response } from 'express';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

class ClienteEstatisticController {
  /**
   * @swagger
   * /cliente-estatistic:
   *   post:
   *     summary: Criar nova estatística de cliente
   *     tags: [Cliente Estatísticas]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateClienteEstatisticDTO'
   *     responses:
   *       201:
   *         description: Estatística criada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Admin ou cliente não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { 
      cliente_id, 
      weight, 
      height, 
      muscle_mass_percentage, 
      notes,
      ombro,
      torax,
      braco_esquerdo,
      braco_direito,
      antebraco_esquerdo,
      antebraco_direito,
      punho,
      cintura,
      abdome,
      quadril,
      coxa_esquerda,
      coxa_direita,
      panturrilha_esquerda,
      panturrilha_direita
    } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("O ID do admin é obrigatório", 400);
    if (!cliente_id) throw new AppError("ID do cliente é obrigatório", 400);

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) throw new AppError("Admin não encontrado", 404);

    const cliente = await knex("clientes").where({ id: cliente_id, admin_id }).first();
    if (!cliente) throw new AppError("Cliente não encontrado", 404);

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [estatistic] = await knex("cliente_estatistic")
      .insert({ 
        admin_id, 
        cliente_id, 
        weight: weight || null, 
        height: height || null, 
        muscle_mass_percentage: muscle_mass_percentage || null, 
        notes: notes || null,
        ombro: ombro || null,
        torax: torax || null,
        braco_esquerdo: braco_esquerdo || null,
        braco_direito: braco_direito || null,
        antebraco_esquerdo: antebraco_esquerdo || null,
        antebraco_direito: antebraco_direito || null,
        punho: punho || null,
        cintura: cintura || null,
        abdome: abdome || null,
        quadril: quadril || null,
        coxa_esquerda: coxa_esquerda || null,
        coxa_direita: coxa_direita || null,
        panturrilha_esquerda: panturrilha_esquerda || null,
        panturrilha_direita: panturrilha_direita || null,
        created_at: now, 
        updated_at: now 
      })
      .returning(["*"]);

    return res.status(201).json(estatistic);
  }

  /**
   * @swagger
   * /cliente-estatistic:
   *   get:
   *     summary: Listar estatísticas de clientes
   *     tags: [Cliente Estatísticas]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *       - in: query
   *         name: cliente_id
   *         schema:
   *           type: number
   *         description: Filtrar por ID do cliente
   *     responses:
   *       200:
   *         description: Lista de estatísticas
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: ID do admin é obrigatório
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { cliente_id } = req.query;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    let query = knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where("cliente_estatistic.admin_id", admin_id);

    if (cliente_id) query = query.where("cliente_estatistic.cliente_id", cliente_id);

    const estatistics = await query.orderBy("cliente_estatistic.created_at", "desc");
    return res.json(estatistics);
  }

  /**
   * @swagger
   * /cliente-estatistic/{id}:
   *   get:
   *     summary: Buscar estatística por ID
   *     tags: [Cliente Estatísticas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID da estatística
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Estatística encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Estatística não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id || !admin_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.id": id, "cliente_estatistic.admin_id": admin_id })
      .first();
    
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);
    return res.json(estatistic);
  }

  /**
   * @swagger
   * /cliente-estatistic/{id}:
   *   put:
   *     summary: Atualizar estatística de cliente
   *     tags: [Cliente Estatísticas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID da estatística
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateClienteEstatisticDTO'
   *     responses:
   *       200:
   *         description: Estatística atualizada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Estatística atualizada com sucesso
   *                 estatistic:
   *                   $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: ID do admin é obrigatório
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Estatística não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { 
      weight, 
      height, 
      muscle_mass_percentage, 
      notes,
      ombro,
      torax,
      braco_esquerdo,
      braco_direito,
      antebraco_esquerdo,
      antebraco_direito,
      punho,
      cintura,
      abdome,
      quadril,
      coxa_esquerda,
      coxa_direita,
      panturrilha_esquerda,
      panturrilha_direita
    } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) throw new AppError("É necessário enviar o ID do admin", 400);

    const estatistic = await knex("cliente_estatistic").where({ id, admin_id }).first();
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);

    await knex("cliente_estatistic").update({
      weight: weight !== undefined ? weight : estatistic.weight,
      height: height !== undefined ? height : estatistic.height,
      muscle_mass_percentage: muscle_mass_percentage !== undefined ? muscle_mass_percentage : estatistic.muscle_mass_percentage,
      notes: notes !== undefined ? notes : estatistic.notes,
      ombro: ombro !== undefined ? ombro : estatistic.ombro,
      torax: torax !== undefined ? torax : estatistic.torax,
      braco_esquerdo: braco_esquerdo !== undefined ? braco_esquerdo : estatistic.braco_esquerdo,
      braco_direito: braco_direito !== undefined ? braco_direito : estatistic.braco_direito,
      antebraco_esquerdo: antebraco_esquerdo !== undefined ? antebraco_esquerdo : estatistic.antebraco_esquerdo,
      antebraco_direito: antebraco_direito !== undefined ? antebraco_direito : estatistic.antebraco_direito,
      punho: punho !== undefined ? punho : estatistic.punho,
      cintura: cintura !== undefined ? cintura : estatistic.cintura,
      abdome: abdome !== undefined ? abdome : estatistic.abdome,
      quadril: quadril !== undefined ? quadril : estatistic.quadril,
      coxa_esquerda: coxa_esquerda !== undefined ? coxa_esquerda : estatistic.coxa_esquerda,
      coxa_direita: coxa_direita !== undefined ? coxa_direita : estatistic.coxa_direita,
      panturrilha_esquerda: panturrilha_esquerda !== undefined ? panturrilha_esquerda : estatistic.panturrilha_esquerda,
      panturrilha_direita: panturrilha_direita !== undefined ? panturrilha_direita : estatistic.panturrilha_direita,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }).where({ id, admin_id });

    const updated = await knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.id": id, "cliente_estatistic.admin_id": admin_id })
      .first();

    return res.status(200).json({ message: "Estatística atualizada com sucesso", estatistic: updated });
  }

  /**
   * @swagger
   * /cliente-estatistic/{id}:
   *   delete:
   *     summary: Excluir estatística de cliente
   *     tags: [Cliente Estatísticas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID da estatística
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Estatística excluída com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Estatística excluída com sucesso
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Estatística não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("cliente_estatistic").where({ id, admin_id }).first();
    if (!estatistic) throw new AppError("Estatística não encontrada", 404);
    
    await knex("cliente_estatistic").where({ id, admin_id }).delete();
    return res.json({ message: "Estatística excluída com sucesso" });
  }

  /**
   * @swagger
   * /cliente-estatistic/latest/{cliente_id}:
   *   get:
   *     summary: Buscar última estatística de um cliente
   *     tags: [Cliente Estatísticas]
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID do cliente
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Última estatística do cliente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteEstatistic'
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Nenhuma estatística encontrada para este cliente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getLatest(req: Request, res: Response): Promise<Response> {
    const { cliente_id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !cliente_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistic = await knex("cliente_estatistic")
      .select("cliente_estatistic.*", "clientes.name as cliente_name")
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.cliente_id": cliente_id, "cliente_estatistic.admin_id": admin_id })
      .orderBy("cliente_estatistic.created_at", "desc")
      .first();
    
    if (!estatistic) throw new AppError("Nenhuma estatística encontrada para este cliente", 404);
    return res.json(estatistic);
  }

  /**
   * @swagger
   * /cliente-estatistic/medidas/{cliente_id}:
   *   get:
   *     summary: Buscar medidas corporais de um cliente
   *     tags: [Cliente Estatísticas]
   *     description: Retorna todas as medidas corporais de um cliente organizadas por data
   *     parameters:
   *       - in: path
   *         name: cliente_id
   *         required: true
   *         schema:
   *           type: number
   *         description: ID do cliente
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do administrador
   *     responses:
   *       200:
   *         description: Medidas corporais do cliente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MedidasResponse'
   *       400:
   *         description: IDs são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getMedidas(req: Request, res: Response): Promise<Response> {
    const { cliente_id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !cliente_id) throw new AppError("É necessário enviar os IDs", 400);

    const estatistics = await knex("cliente_estatistic")
      .select(
        "id",
        "ombro",
        "torax",
        "braco_esquerdo",
        "braco_direito",
        "antebraco_esquerdo",
        "antebraco_direito",
        "punho",
        "cintura",
        "abdome",
        "quadril",
        "coxa_esquerda",
        "coxa_direita",
        "panturrilha_esquerda",
        "panturrilha_direita",
        "created_at"
      )
      .where({ cliente_id, admin_id })
      .orderBy("created_at", "desc");
    
    const medidas = estatistics.map(stat => ({
      id: stat.id,
      data: stat.created_at,
      medidas: {
        ombro: stat.ombro,
        torax: stat.torax,
        bracos: {
          esquerdo: stat.braco_esquerdo,
          direito: stat.braco_direito
        },
        antebracos: {
          esquerdo: stat.antebraco_esquerdo,
          direito: stat.antebraco_direito
        },
        punho: stat.punho,
        cintura: stat.cintura,
        abdome: stat.abdome,
        quadril: stat.quadril,
        coxas: {
          esquerda: stat.coxa_esquerda,
          direita: stat.coxa_direita
        },
        panturrilhas: {
          esquerda: stat.panturrilha_esquerda,
          direita: stat.panturrilha_direita
        }
      }
    }));

    return res.json({ medidas });
  }
}

export default new ClienteEstatisticController();
