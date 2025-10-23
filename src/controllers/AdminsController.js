const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")
const bcrypt = require("bcryptjs")

class AdminsController {
  async create(req, res) {
    const { name, email, password, document, phone_number } = req.body

    if (!name || !email || !password || !document || !phone_number) {
      throw new ErrorApplication("Todos os campos são obrigatórios", 400)
    }

    const emailUsed = await knex("admins").where({ email }).first()
    if (emailUsed) {
      throw new ErrorApplication("Este e-mail já está cadastrado", 400)
    }

    const documentUsed = await knex("admins").where({ document }).first()
    if (documentUsed) {
      throw new ErrorApplication("Este documento já está cadastrado", 400)
    }

    const hashedPassword = await bcrypt.hash(password, 8)
    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss")

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
      .returning(["id", "name", "email", "document", "phone_number", "created_at", "updated_at"])

    return res.status(201).json(admin)
  }

  async index(req, res) {
    const { term } = req.query

    let adminsQuery = knex("admins")
      .select("id", "name", "email", "document", "phone_number", "created_at", "updated_at")

    if (term) {
      adminsQuery = adminsQuery.where(function() {
        this.where("name", "like", `%${term}%`)
          .orWhere("email", "like", `%${term}%`)
          .orWhere("document", "like", `%${term}%`)
      })
    }

    const admins = await adminsQuery.orderBy("name", "asc")

    return res.json(admins)
  }

  async show(req, res) {
    const { id } = req.params

    if (!id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const admin = await knex("admins")
      .select("id", "name", "email", "document", "phone_number", "created_at", "updated_at")
      .where({ id })
      .first()
    
    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
    }
    
    return res.json(admin)
  }

  async update(req, res) {
    const { id } = req.params
    const { name, email, document, phone_number, password } = req.body

    const admin = await knex("admins").where({ id }).first()

    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
    }

    if (email && email !== admin.email) {
      const existingAdminWithEmail = await knex("admins")
        .where({ email })
        .andWhereNot({ id })
        .first()

      if (existingAdminWithEmail) {
        throw new ErrorApplication("Este e-mail já está cadastrado", 400)
      }
    }

    if (document && document !== admin.document) {
      const existingAdminWithDocument = await knex("admins")
        .where({ document })
        .andWhereNot({ id })
        .first()

      if (existingAdminWithDocument) {
        throw new ErrorApplication("Este documento já está cadastrado", 400)
      }
    }

    const updatedData = {
      name: name || admin.name,
      email: email || admin.email,
      document: document || admin.document,
      phone_number: phone_number || admin.phone_number,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    if (password) {
      updatedData.password = await bcrypt.hash(password, 8)
    }

    await knex("admins").update(updatedData).where({ id })

    const updatedAdmin = await knex("admins")
      .select("id", "name", "email", "document", "phone_number", "created_at", "updated_at")
      .where({ id })
      .first()

    return res.status(200).json({
      message: "Admin atualizado com sucesso",
      admin: updatedAdmin
    })
  }

  async delete(req, res) {
    const { id } = req.params

    if (!id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const admin = await knex("admins").where({ id }).first()
    
    if (!admin) {
      throw new ErrorApplication("Admin não encontrado", 404)
    }
    
    await knex("admins").where({ id }).delete()
    
    return res.json({ message: "Admin excluído com sucesso" })
  }
}

module.exports = new AdminsController()
