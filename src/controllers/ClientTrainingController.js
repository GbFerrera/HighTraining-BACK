const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")

class ClientTrainingController {
  async create(req, res) {
    const { client_id, training_id, notes, treinador_id } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!client_id || !training_id) {
      throw new ErrorApplication("ID do cliente e do treino são obrigatórios", 400)
    }

    const admin = await knex("admins").where({ id: admin_id }).first()
    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
    }

    const cliente = await knex("clientes")
      .where({ id: client_id, admin_id })
      .first()
    
    if (!cliente) {
      throw new ErrorApplication("Cliente não encontrado", 404)
    }

    const training = await knex("trainings")
      .where({ id: training_id, admin_id })
      .first()
    
    if (!training) {
      throw new ErrorApplication("Treino não encontrado", 404)
    }

    if (treinador_id) {
      const treinador = await knex("treinadores")
        .where({ id: treinador_id, admin_id })
        .first()
      
      if (!treinador) {
        throw new ErrorApplication("Treinador não encontrado", 404)
      }
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss")

    const [clientTraining] = await knex("client_training")
      .insert({
        admin_id,
        treinador_id: treinador_id || null,
        client_id,
        training_id,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "treinador_id",
        "client_id",
        "training_id",
        "notes",
        "created_at",
        "updated_at",
      ])

    return res.status(201).json(clientTraining)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { client_id, training_id, treinador_id } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    let clientTrainingQuery = knex("client_training")
      .select(
        "client_training.id",
        "client_training.admin_id",
        "client_training.treinador_id",
        "client_training.client_id",
        "client_training.training_id",
        "client_training.notes",
        "client_training.created_at",
        "client_training.updated_at",
        "clientes.name as cliente_name",
        "trainings.name as training_name",
        "treinadores.name as treinador_name"
      )
      .leftJoin("clientes", "client_training.client_id", "clientes.id")
      .leftJoin("trainings", "client_training.training_id", "trainings.id")
      .leftJoin("treinadores", "client_training.treinador_id", "treinadores.id")
      .where("client_training.admin_id", admin_id)

    if (client_id) {
      clientTrainingQuery = clientTrainingQuery.where("client_training.client_id", client_id)
    }

    if (training_id) {
      clientTrainingQuery = clientTrainingQuery.where("client_training.training_id", training_id)
    }

    if (treinador_id) {
      clientTrainingQuery = clientTrainingQuery.where("client_training.treinador_id", treinador_id)
    }

    const clientTrainings = await clientTrainingQuery.orderBy("client_training.created_at", "desc")

    return res.json(clientTrainings)
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

    const clientTraining = await knex("client_training")
      .select(
        "client_training.id",
        "client_training.admin_id",
        "client_training.treinador_id",
        "client_training.client_id",
        "client_training.training_id",
        "client_training.notes",
        "client_training.created_at",
        "client_training.updated_at",
        "clientes.name as cliente_name",
        "trainings.name as training_name",
        "treinadores.name as treinador_name"
      )
      .leftJoin("clientes", "client_training.client_id", "clientes.id")
      .leftJoin("trainings", "client_training.training_id", "trainings.id")
      .leftJoin("treinadores", "client_training.treinador_id", "treinadores.id")
      .where({ "client_training.id": id, "client_training.admin_id": admin_id })
      .first()
    
    if (!clientTraining) {
      throw new ErrorApplication("Registro não encontrado", 404)
    }
    
    return res.json(clientTraining)
  }

  async update(req, res) {
    const { id } = req.params
    const { notes, treinador_id } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const clientTraining = await knex("client_training").where({ id, admin_id }).first()

    if (!clientTraining) {
      throw new ErrorApplication("Registro não encontrado", 404)
    }

    if (treinador_id) {
      const treinador = await knex("treinadores")
        .where({ id: treinador_id, admin_id })
        .first()
      
      if (!treinador) {
        throw new ErrorApplication("Treinador não encontrado", 404)
      }
    }

    const updatedData = {
      notes: notes !== undefined ? notes : clientTraining.notes,
      treinador_id: treinador_id !== undefined ? treinador_id : clientTraining.treinador_id,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    await knex("client_training").update(updatedData).where({ id, admin_id })

    const updatedClientTraining = await knex("client_training")
      .select(
        "client_training.id",
        "client_training.admin_id",
        "client_training.treinador_id",
        "client_training.client_id",
        "client_training.training_id",
        "client_training.notes",
        "client_training.created_at",
        "client_training.updated_at",
        "clientes.name as cliente_name",
        "trainings.name as training_name",
        "treinadores.name as treinador_name"
      )
      .leftJoin("clientes", "client_training.client_id", "clientes.id")
      .leftJoin("trainings", "client_training.training_id", "trainings.id")
      .leftJoin("treinadores", "client_training.treinador_id", "treinadores.id")
      .where({ "client_training.id": id, "client_training.admin_id": admin_id })
      .first()

    return res.status(200).json({
      message: "Registro atualizado com sucesso",
      clientTraining: updatedClientTraining
    })
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e do registro", 400)
    }

    const clientTraining = await knex("client_training").where({ id, admin_id }).first()
    
    if (!clientTraining) {
      throw new ErrorApplication("Registro não encontrado", 404)
    }
    
    await knex("client_training").where({ id, admin_id }).delete()
    
    return res.json({ message: "Registro excluído com sucesso" })
  }
}

module.exports = new ClientTrainingController()
