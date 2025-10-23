const ErrorApplication = require("../utils/ErrorApplication")
const moment = require("moment-timezone")
const knex = require("../database/knex")
const bcrypt = require("bcryptjs")

class ClientesController {
  async create(req, res) {
    const { name, email, password, treinador_id, phone_number, date_of_birth, gender } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("O ID do admin é obrigatório", 400)
    }

    if (!name || !email || !password) {
      throw new ErrorApplication("Nome, e-mail e senha são obrigatórios", 400)
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

    const emailUsed = await knex("clientes")
      .where({ email, admin_id })
      .first()

    if (emailUsed) {
      throw new ErrorApplication("Este e-mail já está cadastrado", 400)
    }

    const hashedPassword = await bcrypt.hash(password, 8)
    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss")

    const [cliente] = await knex("clientes")
      .insert({
        admin_id,
        treinador_id: treinador_id || null,
        name,
        email,
        password: hashedPassword,
        phone_number: phone_number || null,
        date_of_birth: date_of_birth || null,
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
        "gender",
        "created_at",
        "updated_at",
      ])

    return res.status(201).json(cliente)
  }

  async index(req, res) {
    const { admin_id } = req.headers
    const { term, treinador_id } = req.query

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
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
        "clientes.gender",
        "clientes.created_at",
        "clientes.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "clientes.treinador_id", "treinadores.id")
      .where("clientes.admin_id", admin_id)

    if (term) {
      clientesQuery = clientesQuery.where(function() {
        this.where("clientes.name", "like", `%${term}%`)
          .orWhere("clientes.email", "like", `%${term}%`)
          .orWhere("clientes.phone_number", "like", `%${term}%`)
      })
    }

    if (treinador_id) {
      clientesQuery = clientesQuery.where("clientes.treinador_id", treinador_id)
    }

    const clientes = await clientesQuery.orderBy("clientes.name", "asc")

    return res.json(clientes)
  }

  async show(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!id) {
      throw new ErrorApplication("É necessário enviar o ID do cliente", 400)
    }

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
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
        "clientes.gender",
        "clientes.created_at",
        "clientes.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "clientes.treinador_id", "treinadores.id")
      .where({ "clientes.id": id, "clientes.admin_id": admin_id })
      .first()
    
    if (!cliente) {
      throw new ErrorApplication("Cliente não encontrado", 404)
    }
    
    return res.json(cliente)
  }

  async update(req, res) {
    const { id } = req.params
    const { name, email, password, treinador_id, phone_number, date_of_birth, gender } = req.body
    const { admin_id } = req.headers

    if (!admin_id) {
      throw new ErrorApplication("É necessário enviar o ID do admin", 400)
    }

    const cliente = await knex("clientes").where({ id, admin_id }).first()

    if (!cliente) {
      throw new ErrorApplication("Cliente não encontrado", 404)
    }

    if (email && email !== cliente.email) {
      const existingClienteWithEmail = await knex("clientes")
        .where({ email, admin_id })
        .andWhereNot({ id })
        .first()

      if (existingClienteWithEmail) {
        throw new ErrorApplication("Este e-mail já está cadastrado", 400)
      }
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
      name: name || cliente.name,
      email: email || cliente.email,
      treinador_id: treinador_id !== undefined ? treinador_id : cliente.treinador_id,
      phone_number: phone_number !== undefined ? phone_number : cliente.phone_number,
      date_of_birth: date_of_birth !== undefined ? date_of_birth : cliente.date_of_birth,
      gender: gender !== undefined ? gender : cliente.gender,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    }

    if (password) {
      updatedData.password = await bcrypt.hash(password, 8)
    }

    await knex("clientes").update(updatedData).where({ id, admin_id })

    const updatedCliente = await knex("clientes")
      .select(
        "clientes.id",
        "clientes.admin_id",
        "clientes.treinador_id",
        "clientes.name",
        "clientes.email",
        "clientes.phone_number",
        "clientes.date_of_birth",
        "clientes.gender",
        "clientes.created_at",
        "clientes.updated_at",
        "treinadores.name as treinador_name"
      )
      .leftJoin("treinadores", "clientes.treinador_id", "treinadores.id")
      .where({ "clientes.id": id, "clientes.admin_id": admin_id })
      .first()

    return res.status(200).json({
      message: "Cliente atualizado com sucesso",
      cliente: updatedCliente
    })
  }

  async delete(req, res) {
    const { id } = req.params
    const { admin_id } = req.headers

    if (!admin_id || !id) {
      throw new ErrorApplication("É necessário enviar o ID do admin e do cliente", 400)
    }

    const cliente = await knex("clientes").where({ id, admin_id }).first()
    
    if (!cliente) {
      throw new ErrorApplication("Cliente não encontrado", 404)
    }
    
    await knex("clientes").where({ id, admin_id }).delete()
    
    return res.json({ message: "Cliente excluído com sucesso" })
  }
}

module.exports = new ClientesController()
