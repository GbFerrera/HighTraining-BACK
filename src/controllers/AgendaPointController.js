const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")

class AgendaPointController {
  async create(req, res) {
    const { cliente_id, training_date, duration_times, notes } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!cliente_id || !training_date) {
      throw new ErrorApplication("ID do cliente e data do treino são obrigatórios", 400)
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

    const [agendaPoint] = await knex("agenda_point")
      .insert({
        admin_id,
        cliente_id,
        training_date,
        duration_times: duration_times || null,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "cliente_id",
        "training_date",
        "duration_times",
        "notes",
        "created_at",
        "updated_at",
      ])

    return res.status(201).json(agendaPoint)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { cliente_id, start_date, end_date } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    let agendaQuery = knex("agenda_point")
      .select(
        "agenda_point.id",
        "agenda_point.admin_id",
        "agenda_point.cliente_id",
        "agenda_point.training_date",
        "agenda_point.duration_times",
        "agenda_point.notes",
        "agenda_point.created_at",
        "agenda_point.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where("agenda_point.admin_id", admin_id)

    if (cliente_id) {
      agendaQuery = agendaQuery.where("agenda_point.cliente_id", cliente_id)
    }

    if (start_date) {
      agendaQuery = agendaQuery.where("agenda_point.training_date", ">=", start_date)
    }

    if (end_date) {
      agendaQuery = agendaQuery.where("agenda_point.training_date", "<=", end_date)
    }

    const agendaPoints = await agendaQuery.orderBy("agenda_point.training_date", "asc")

    return res.json(agendaPoints)
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

    const agendaPoint = await knex("agenda_point")
      .select(
        "agenda_point.id",
        "agenda_point.admin_id",
        "agenda_point.cliente_id",
        "agenda_point.training_date",
        "agenda_point.duration_times",
        "agenda_point.notes",
        "agenda_point.created_at",
        "agenda_point.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where({ "agenda_point.id": id, "agenda_point.admin_id": admin_id })
      .first()
    
    if (!agendaPoint) {
      throw new ErrorApplication("Agendamento não encontrado", 404)
    }
    
    return res.json(agendaPoint)
  }

  async update(req, res) {
    const { id } = req.params
    const { training_date, duration_times, notes } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const agendaPoint = await knex("agenda_point").where({ id, admin_id }).first()

    if (!agendaPoint) {
      throw new ErrorApplication("Agendamento não encontrado", 404)
    }

    const updatedData = {
      training_date: training_date || agendaPoint.training_date,
      duration_times: duration_times !== undefined ? duration_times : agendaPoint.duration_times,
      notes: notes !== undefined ? notes : agendaPoint.notes,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    await knex("agenda_point").update(updatedData).where({ id, admin_id })

    const updatedAgendaPoint = await knex("agenda_point")
      .select(
        "agenda_point.id",
        "agenda_point.admin_id",
        "agenda_point.cliente_id",
        "agenda_point.training_date",
        "agenda_point.duration_times",
        "agenda_point.notes",
        "agenda_point.created_at",
        "agenda_point.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where({ "agenda_point.id": id, "agenda_point.admin_id": admin_id })
      .first()

    return res.status(200).json({
      message: "Agendamento atualizado com sucesso",
      agendaPoint: updatedAgendaPoint
    })
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e do agendamento", 400)
    }

    const agendaPoint = await knex("agenda_point").where({ id, admin_id }).first()
    
    if (!agendaPoint) {
      throw new ErrorApplication("Agendamento não encontrado", 404)
    }
    
    await knex("agenda_point").where({ id, admin_id }).delete()
    
    return res.json({ message: "Agendamento excluído com sucesso" })
  }

  async getByDate(req, res) {
    const { date } = req.params
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    if (!date) {
      throw new ErrorApplication("É necessário enviar a data", 400)
    }

    const startOfDay = moment(date).startOf('day').format("YYYY-MM-DD HH:mm:ss")
    const endOfDay = moment(date).endOf('day').format("YYYY-MM-DD HH:mm:ss")

    const agendaPoints = await knex("agenda_point")
      .select(
        "agenda_point.id",
        "agenda_point.admin_id",
        "agenda_point.cliente_id",
        "agenda_point.training_date",
        "agenda_point.duration_times",
        "agenda_point.notes",
        "agenda_point.created_at",
        "agenda_point.updated_at",
        "clientes.name as cliente_name"
      )
      .leftJoin("clientes", "agenda_point.cliente_id", "clientes.id")
      .where("agenda_point.admin_id", admin_id)
      .whereBetween("agenda_point.training_date", [startOfDay, endOfDay])
      .orderBy("agenda_point.training_date", "asc")
    
    return res.json(agendaPoints)
  }
}

module.exports = new AgendaPointController()
