const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")

class ClienteEstatisticController {
  async create(req, res) {
    const { cliente_id, weight, height, muscle_mass_percentage, notes } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!cliente_id) {
      throw new ErrorApplication("ID do cliente é obrigatório", 400)
    }

    const admin = await knex("admins").where({ id: admin_id }).first()
    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
    }

    const cliente = await knex("clientes")
      .where({ id: cliente_id, admin_id })
      .first()
    
    if (!cliente) {
      throw new ErrorApplication("Cliente não encontrado", 404)
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss")

    const [estatistic] = await knex("cliente_estatistic")
      .insert({
        admin_id,
        cliente_id,
        weight: weight || null,
        height: height || null,
        muscle_mass_percentage: muscle_mass_percentage || null,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "cliente_id",
        "weight",
        "height",
        "muscle_mass_percentage",
        "notes",
        "created_at",
        "updated_at",
      ])

    return res.status(201).json(estatistic)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { cliente_id } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    let estatisticsQuery = knex("cliente_estatistic")
      .select(
        "cliente_estatistic.id",
        "cliente_estatistic.admin_id",
        "cliente_estatistic.cliente_id",
        "cliente_estatistic.weight",
        "cliente_estatistic.height",
        "cliente_estatistic.muscle_mass_percentage",
        "cliente_estatistic.notes",
        "cliente_estatistic.created_at",
        "cliente_estatistic.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where("cliente_estatistic.admin_id", admin_id)

    if (cliente_id) {
      estatisticsQuery = estatisticsQuery.where("cliente_estatistic.cliente_id", cliente_id)
    }

    const estatistics = await estatisticsQuery.orderBy("cliente_estatistic.created_at", "desc")

    return res.json(estatistics)
  }

  async show(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!id) {
      throw new ErrorApplication("É necessário enviar o ID", 400)
    }

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const estatistic = await knex("cliente_estatistic")
      .select(
        "cliente_estatistic.id",
        "cliente_estatistic.admin_id",
        "cliente_estatistic.cliente_id",
        "cliente_estatistic.weight",
        "cliente_estatistic.height",
        "cliente_estatistic.muscle_mass_percentage",
        "cliente_estatistic.notes",
        "cliente_estatistic.created_at",
        "cliente_estatistic.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.id": id, "cliente_estatistic.admin_id": admin_id })
      .first()
    
    if (!estatistic) {
      throw new ErrorApplication("Estatística não encontrada", 404)
    }
    
    return res.json(estatistic)
  }

  async update(req, res) {
    const { id } = req.params
    const { weight, height, muscle_mass_percentage, notes } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const estatistic = await knex("cliente_estatistic").where({ id, admin_id }).first()

    if (!estatistic) {
      throw new ErrorApplication("Estatística não encontrada", 404)
    }

    const updatedData = {
      weight: weight !== undefined ? weight : estatistic.weight,
      height: height !== undefined ? height : estatistic.height,
      muscle_mass_percentage: muscle_mass_percentage !== undefined ? muscle_mass_percentage : estatistic.muscle_mass_percentage,
      notes: notes !== undefined ? notes : estatistic.notes,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    await knex("cliente_estatistic").update(updatedData).where({ id, admin_id })

    const updatedEstatistic = await knex("cliente_estatistic")
      .select(
        "cliente_estatistic.id",
        "cliente_estatistic.admin_id",
        "cliente_estatistic.cliente_id",
        "cliente_estatistic.weight",
        "cliente_estatistic.height",
        "cliente_estatistic.muscle_mass_percentage",
        "cliente_estatistic.notes",
        "cliente_estatistic.created_at",
        "cliente_estatistic.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.id": id, "cliente_estatistic.admin_id": admin_id })
      .first()

    return res.status(200).json({
      message: "Estatística atualizada com sucesso",
      estatistic: updatedEstatistic
    })
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e da estatística", 400)
    }

    const estatistic = await knex("cliente_estatistic").where({ id, admin_id }).first()
    
    if (!estatistic) {
      throw new ErrorApplication("Estatística não encontrada", 404)
    }
    
    await knex("cliente_estatistic").where({ id, admin_id }).delete()
    
    return res.json({ message: "Estatística excluída com sucesso" })
  }

  async getLatest(req, res) {
    const { cliente_id } = req.params
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    if (!cliente_id) {
      throw new ErrorApplication("É necessário enviar o ID do cliente", 400)
    }

    const estatistic = await knex("cliente_estatistic")
      .select(
        "cliente_estatistic.id",
        "cliente_estatistic.admin_id",
        "cliente_estatistic.cliente_id",
        "cliente_estatistic.weight",
        "cliente_estatistic.height",
        "cliente_estatistic.muscle_mass_percentage",
        "cliente_estatistic.notes",
        "cliente_estatistic.created_at",
        "cliente_estatistic.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "cliente_estatistic.cliente_id", "clientes.id")
      .where({ "cliente_estatistic.cliente_id": cliente_id, "cliente_estatistic.admin_id": admin_id })
      .orderBy("cliente_estatistic.created_at", "desc")
      .first()
    
    if (!estatistic) {
      throw new ErrorApplication("Nenhuma estatística encontrada para este cliente", 404)
    }
    
    return res.json(estatistic)
  }
}

module.exports = new ClienteEstatisticController()
