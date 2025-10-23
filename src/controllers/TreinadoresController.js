const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")
const bcrypt = require("bcryptjs")

class TreinadoresController {
  async create(req, res) {
    const { name, email, password, document, phone_number, position } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!name || !email || !password || !document || !phone_number) {
      throw new ErrorApplication("Todos os campos obrigatórios devem ser preenchidos", 400)
    }

    const admin = await knex("admins").where({ id: admin_id }).first()
    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
    }

    const emailUsed = await knex("treinadores")
      .where({ email, admin_id })
      .first()

    if (emailUsed) {
      throw new ErrorApplication("Este e-mail já está cadastrado", 400)
    }

    const documentUsed = await knex("treinadores")
      .where({ document, admin_id })
      .first()

    if (documentUsed) {
      throw new ErrorApplication("Este documento já está cadastrado", 400)
    }

    const hashedPassword = await bcrypt.hash(password, 8)
    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss")

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
      ])

    return res.status(201).json(treinador)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { term } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
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
      .where("admin_id", admin_id)

    if (term) {
      treinadoresQuery = treinadoresQuery.where(function() {
        this.where("name", "like", `%${term}%`)
          .orWhere("email", "like", `%${term}%`)
          .orWhere("document", "like", `%${term}%`)
      })
    }

    const treinadores = await treinadoresQuery.orderBy("name", "asc")

    return res.json(treinadores)
  }

  async show(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!id) {
      throw new ErrorApplication("É necessário enviar o ID do treinador", 400)
    }

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
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
      .first()
    
    if (!treinador) {
      throw new ErrorApplication("Treinador não encontrado", 404)
    }
    
    return res.json(treinador)
  }

  async update(req, res) {
    const { id } = req.params
    const { name, email, document, phone_number, position, password } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const treinador = await knex("treinadores").where({ id, admin_id }).first()

    if (!treinador) {
      throw new ErrorApplication("Treinador não encontrado", 404)
    }

    if (email && email !== treinador.email) {
      const existingTreinadorWithEmail = await knex("treinadores")
        .where({ email, admin_id })
        .andWhereNot({ id })
        .first()

      if (existingTreinadorWithEmail) {
        throw new ErrorApplication("Este e-mail já está cadastrado", 400)
      }
    }

    if (document && document !== treinador.document) {
      const existingTreinadorWithDocument = await knex("treinadores")
        .where({ document, admin_id })
        .andWhereNot({ id })
        .first()

      if (existingTreinadorWithDocument) {
        throw new ErrorApplication("Este documento já está cadastrado", 400)
      }
    }

    const updatedData = {
      name: name || treinador.name,
      email: email || treinador.email,
      document: document || treinador.document,
      phone_number: phone_number || treinador.phone_number,
      position: position !== undefined ? position : treinador.position,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    if (password) {
      updatedData.password = await bcrypt.hash(password, 8)
    }

    await knex("treinadores").update(updatedData).where({ id, admin_id })

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
      .first()

    return res.status(200).json({
      message: "Treinador atualizado com sucesso",
      treinador: updatedTreinador
    })
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e do treinador", 400)
    }

    const treinador = await knex("treinadores").where({ id, admin_id }).first()
    
    if (!treinador) {
      throw new ErrorApplication("Treinador não encontrado", 404)
    }
    
    await knex("treinadores").where({ id, admin_id }).delete()
    
    return res.json({ message: "Treinador excluído com sucesso" })
  }
}

module.exports = new TreinadoresController()
