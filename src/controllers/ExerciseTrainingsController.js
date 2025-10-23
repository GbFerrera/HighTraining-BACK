const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")

class ExerciseTrainingsController {
  async create(req, res) {
    const { training_id, exercise_id } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!training_id || !exercise_id) {
      throw new ErrorApplication("ID do treino e do exercício são obrigatórios", 400)
    }

    const admin = await knex("admins").where({ id: admin_id }).first()
    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
    }

    const training = await knex("trainings")
      .where({ id: training_id, admin_id })
      .first()
    
    if (!training) {
      throw new ErrorApplication("Treino não encontrado", 404)
    }

    const exercise = await knex("exercises")
      .where({ id: exercise_id, admin_id })
      .first()
    
    if (!exercise) {
      throw new ErrorApplication("Exercício não encontrado", 404)
    }

    // Verificar se já existe essa relação
    const existingRelation = await knex("exercise_trainings")
      .where({ training_id, exercise_id, admin_id })
      .first()

    if (existingRelation) {
      throw new ErrorApplication("Este exercício já está vinculado a este treino", 400)
    }

    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss")

    const [exerciseTraining] = await knex("exercise_trainings")
      .insert({
        admin_id,
        training_id,
        exercise_id,
        created_at: now,
        updated_at: now,
      })
      .returning([
        "id",
        "admin_id",
        "training_id",
        "exercise_id",
        "created_at",
        "updated_at",
      ])

    return res.status(201).json(exerciseTraining)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { training_id, exercise_id } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    let exerciseTrainingsQuery = knex("exercise_trainings")
      .select(
        "exercise_trainings.id",
        "exercise_trainings.admin_id",
        "exercise_trainings.training_id",
        "exercise_trainings.exercise_id",
        "exercise_trainings.created_at",
        "exercise_trainings.updated_at",
        "trainings.name as training_name",
        "exercises.name as exercise_name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes"
      )
      .leftJoin("trainings", "exercise_trainings.training_id", "trainings.id")
      .leftJoin("exercises", "exercise_trainings.exercise_id", "exercises.id")
      .where("exercise_trainings.admin_id", admin_id)

    if (training_id) {
      exerciseTrainingsQuery = exerciseTrainingsQuery.where("exercise_trainings.training_id", training_id)
    }

    if (exercise_id) {
      exerciseTrainingsQuery = exerciseTrainingsQuery.where("exercise_trainings.exercise_id", exercise_id)
    }

    const exerciseTrainings = await exerciseTrainingsQuery.orderBy("exercise_trainings.created_at", "desc")

    return res.json(exerciseTrainings)
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

    const exerciseTraining = await knex("exercise_trainings")
      .select(
        "exercise_trainings.id",
        "exercise_trainings.admin_id",
        "exercise_trainings.training_id",
        "exercise_trainings.exercise_id",
        "exercise_trainings.created_at",
        "exercise_trainings.updated_at",
        "trainings.name as training_name",
        "exercises.name as exercise_name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes"
      )
      .leftJoin("trainings", "exercise_trainings.training_id", "trainings.id")
      .leftJoin("exercises", "exercise_trainings.exercise_id", "exercises.id")
      .where({ "exercise_trainings.id": id, "exercise_trainings.admin_id": admin_id })
      .first()
    
    if (!exerciseTraining) {
      throw new ErrorApplication("Registro não encontrado", 404)
    }
    
    return res.json(exerciseTraining)
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e do registro", 400)
    }

    const exerciseTraining = await knex("exercise_trainings").where({ id, admin_id }).first()
    
    if (!exerciseTraining) {
      throw new ErrorApplication("Registro não encontrado", 404)
    }
    
    await knex("exercise_trainings").where({ id, admin_id }).delete()
    
    return res.json({ message: "Exercício removido do treino com sucesso" })
  }

  async getByTraining(req, res) {
    const { training_id } = req.params
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    if (!training_id) {
      throw new ErrorApplication("É necessário enviar o ID do treino", 400)
    }

    const exercises = await knex("exercise_trainings")
      .select(
        "exercise_trainings.id",
        "exercise_trainings.admin_id",
        "exercise_trainings.training_id",
        "exercise_trainings.exercise_id",
        "exercise_trainings.created_at",
        "exercise_trainings.updated_at",
        "exercises.name as exercise_name",
        "exercises.repetitions",
        "exercises.series",
        "exercises.carga",
        "exercises.notes"
      )
      .leftJoin("exercises", "exercise_trainings.exercise_id", "exercises.id")
      .where({ "exercise_trainings.training_id": training_id, "exercise_trainings.admin_id": admin_id })
      .orderBy("exercises.name", "asc")
    
    return res.json(exercises)
  }
}

module.exports = new ExerciseTrainingsController()
