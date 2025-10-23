const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")

class ExercisesController {
  async create(req, res) {
    const { name, repetitions, series, carga, notes, treinador_id } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!name) {
      throw new ErrorApplication("Nome do exercício é obrigatório", 400)
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

    const [exercise] = await knex("exercises")
      .insert({
        admin_id,
        treinador_id: treinador_id || null,
        name,
        repetitions: repetitions || null,
        series: series || null,
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
        "repetitions",
        "series",
        "carga",
        "notes",
        "created_at",
        "updated_at",
      ])

    return res.status(201).json(exercise)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { term, treinador_id } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    let exercisesQuery = knex("exercises")
      .select(
        "exercises.id",
        "exercises.admin_id",
        "exercises.treinador_id",
        "exercises.name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes",
        "exercises.created_at",
        "exercises.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "exercises.treinador_id", "treinadores.id")
      .where("exercises.admin_id", admin_id)

    if (term) {
      exercisesQuery = exercisesQuery.where(function() {
        this.where("exercises.name", "like", `%${term}%`)
          .orWhere("exercises.notes", "like", `%${term}%`)
      })
    }

    if (treinador_id) {
      exercisesQuery = exercisesQuery.where("exercises.treinador_id", treinador_id)
    }

    const exercises = await exercisesQuery.orderBy("exercises.name", "asc")

    return res.json(exercises)
  }

  async show(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!id) {
      throw new ErrorApplication("É necessário enviar o ID do exercício", 400)
    }

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const exercise = await knex("exercises")
      .select(
        "exercises.id",
        "exercises.admin_id",
        "exercises.treinador_id",
        "exercises.name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes",
        "exercises.created_at",
        "exercises.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "exercises.treinador_id", "treinadores.id")
      .where({ "exercises.id": id, "exercises.admin_id": admin_id })
      .first()
    
    if (!exercise) {
      throw new ErrorApplication("Exercício não encontrado", 404)
    }
    
    return res.json(exercise)
  }

  async update(req, res) {
    const { id } = req.params
    const { name, repetitions, series, carga, notes, treinador_id } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const exercise = await knex("exercises").where({ id, admin_id }).first()

    if (!exercise) {
      throw new ErrorApplication("Exercício não encontrado", 404)
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
      name: name || exercise.name,
      repetitions: repetitions !== undefined ? repetitions : exercise.repetitions,
      series: series !== undefined ? series : exercise.series,
      carga: carga !== undefined ? carga : exercise.carga,
      notes: notes !== undefined ? notes : exercise.notes,
      treinador_id: treinador_id !== undefined ? treinador_id : exercise.treinador_id,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    await knex("exercises").update(updatedData).where({ id, admin_id })

    const updatedExercise = await knex("exercises")
      .select(
        "exercises.id",
        "exercises.admin_id",
        "exercises.treinador_id",
        "exercises.name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes",
        "exercises.created_at",
        "exercises.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "exercises.treinador_id", "treinadores.id")
      .where({ "exercises.id": id, "exercises.admin_id": admin_id })
      .first()

    return res.status(200).json({
      message: "Exercício atualizado com sucesso",
      exercise: updatedExercise
    })
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e do exercício", 400)
    }

    const exercise = await knex("exercises").where({ id, admin_id }).first()
    
    if (!exercise) {
      throw new ErrorApplication("Exercício não encontrado", 404)
    }
    
    await knex("exercises").where({ id, admin_id }).delete()
    
    return res.json({ message: "Exercício excluído com sucesso" })
  }
}

module.exports = new ExercisesController()
