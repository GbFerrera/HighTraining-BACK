const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")

class TrainingsController {
  async create(req, res) {
    const { name, duration, repeticoes, video_url, carga, notes, treinador_id } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!name) {
      throw new ErrorApplication("Nome do treino é obrigatório", 400)
    }

    const admin = await knex("admins").where({ id: admin_id }).first()
    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
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
      ])

    return res.status(201).json(training)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { term, treinador_id } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
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
      .where("trainings.admin_id", admin_id)

    if (term) {
      trainingsQuery = trainingsQuery.where(function() {
        this.where("trainings.name", "like", `%${term}%`)
          .orWhere("trainings.notes", "like", `%${term}%`)
      })
    }

    if (treinador_id) {
      trainingsQuery = trainingsQuery.where("trainings.treinador_id", treinador_id)
    }

    const trainings = await trainingsQuery.orderBy("trainings.name", "asc")

    return res.json(trainings)
  }

  async show(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!id) {
      throw new ErrorApplication("É necessário enviar o ID do treino", 400)
    }

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
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
      .first()
    
    if (!training) {
      throw new ErrorApplication("Treino não encontrado", 404)
    }
    
    return res.json(training)
  }

  async update(req, res) {
    const { id } = req.params
    const { name, duration, repeticoes, video_url, carga, notes, treinador_id } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const training = await knex("trainings").where({ id, admin_id }).first()

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

    const updatedData = {
      name: name || training.name,
      duration: duration !== undefined ? duration : training.duration,
      repeticoes: repeticoes !== undefined ? repeticoes : training.repeticoes,
      video_url: video_url !== undefined ? video_url : training.video_url,
      carga: carga !== undefined ? carga : training.carga,
      notes: notes !== undefined ? notes : training.notes,
      treinador_id: treinador_id !== undefined ? treinador_id : training.treinador_id,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    await knex("trainings").update(updatedData).where({ id, admin_id })

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
      .first()

    return res.status(200).json({
      message: "Treino atualizado com sucesso",
      training: updatedTraining
    })
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e do treino", 400)
    }

    const training = await knex("trainings").where({ id, admin_id }).first()
    
    if (!training) {
      throw new ErrorApplication("Treino não encontrado", 404)
    }
    
    await knex("trainings").where({ id, admin_id }).delete()
    
    return res.json({ message: "Treino excluído com sucesso" })
  }
}

module.exports = new TrainingsController()
