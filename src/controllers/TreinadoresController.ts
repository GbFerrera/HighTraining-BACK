import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import moment from 'moment-timezone';
import knex from '../database/knex';
import AppError from '../utils/AppError';

interface CreateTreinadorDTO {
  name: string;
  email: string;
  password: string;
  document: string;
  phone_number: string;
  position?: string;
  years_of_experience?: number;
  specialties?: string;
  academic_background?: string;
  about_me?: string;
  instagram?: string;
  cref?: string;
}

interface UpdateTreinadorDTO {
  name?: string;
  email?: string;
  document?: string;
  phone_number?: string;
  position?: string;
  password?: string;
  years_of_experience?: number;
  specialties?: string;
  academic_background?: string;
  about_me?: string;
  instagram?: string;
  cref?: string;
}

interface TreinadorQueryParams {
  term?: string;
}

class TreinadoresController {
  /**
   * @swagger
   * /trainers:
   *   post:
   *     summary: Create trainer
   *     tags: [Trainers]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password, document, phone_number]
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               document:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               position:
   *                 type: string
   *                 nullable: true
   *               instagram:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       201:
   *         description: Trainer created
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { name, email, password, document, phone_number, position,
      years_of_experience, specialties, academic_background, about_me, instagram, cref
    } = req.body as CreateTreinadorDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("O ID do admin é obrigatório", 400);
    }

    if (!name || !email || !password || !document || !phone_number) {
      throw new AppError("Todos os campos obrigatórios devem ser preenchidos", 400);
    }

    const admin = await knex("admins").where({ id: admin_id }).first();
    if (!admin) {
      throw new AppError("Admin não encontrado", 404);
    }

    const emailUsed = await knex("trainers")
      .where({ email, admin_id })
      .first();

    if (emailUsed) {
      throw new AppError("Este e-mail já está cadastrado", 400);
    }

    const documentUsed = await knex("trainers")
      .where({ document, admin_id })
      .first();

    if (documentUsed) {
      throw new AppError("Este documento já está cadastrado", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const now = moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");

    const [treinador] = await knex("trainers")
      .insert({
        admin_id,
        name,
        email,
        password: hashedPassword,
        document,
        phone_number,
        position: position || null,
        years_of_experience: years_of_experience || null,
        specialties: specialties || null,
        academic_background: academic_background || null,
        about_me: about_me || null,
        instagram: instagram || null,
        cref: cref || null,
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
        "years_of_experience",
        "specialties",
        "academic_background",
        "about_me",
        "instagram",
        "cref",
        "created_at",
        "updated_at",
      ]);

    return res.status(201).json(treinador);
  }

  /**
   * @swagger
   * /trainers:
   *   get:
   *     summary: List trainers
   *     tags: [Trainers]
   *     parameters:
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: term
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Trainer list
   */
  async index(req: Request, res: Response): Promise<Response> {
    const admin_id = req.headers.admin_id as string;
    const { term } = req.query as TreinadorQueryParams;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    let treinadoresQuery = knex("trainers")
      .select(
        "id",
        "admin_id",
        "name",
        "email",
        "document",
        "phone_number",
        "position",
        "years_of_experience",
        "specialties",
        "academic_background",
        "about_me",
        "instagram",
        "cref",
        "created_at",
        "updated_at"
      )
      .where("admin_id", admin_id);

    if (term) {
      treinadoresQuery = treinadoresQuery.where(function() {
        this.where("name", "like", `%${term}%`)
          .orWhere("email", "like", `%${term}%`)
          .orWhere("document", "like", `%${term}%`);
      });
    }

    const treinadores = await treinadoresQuery.orderBy("name", "asc");

    return res.json(treinadores);
  }

  /**
   * @swagger
   * /trainers/{id}:
   *   get:
   *     summary: Get trainer by ID
   *     tags: [Trainers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Trainer found
   */
  async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!id) {
      throw new AppError("É necessário enviar o ID do treinador", 400);
    }

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const treinador = await knex("trainers")
      .select(
        "id",
        "admin_id",
        "name",
        "email",
        "document",
        "phone_number",
        "position",
        "years_of_experience",
        "specialties",
        "academic_background",
        "about_me",
        "instagram",
        "cref",
        "created_at",
        "updated_at"
      )
      .where({ id, admin_id })
      .first();
    
    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }
    
    return res.json(treinador);
  }

  /**
   * @swagger
   * /trainers/{id}:
   *   put:
   *     summary: Update trainer
   *     tags: [Trainers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               document:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               position:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Trainer updated
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { name, email, document, phone_number, position, password,
      years_of_experience, specialties, academic_background, about_me, instagram, cref
    } = req.body as UpdateTreinadorDTO;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    const treinador = await knex("trainers").where({ id, admin_id }).first();

    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }

    if (email && email !== treinador.email) {
      const existingTreinadorWithEmail = await knex("trainers")
        .where({ email, admin_id })
        .andWhereNot({ id })
        .first();

      if (existingTreinadorWithEmail) {
        throw new AppError("Este e-mail já está cadastrado", 400);
      }
    }

    if (document && document !== treinador.document) {
      const existingTreinadorWithDocument = await knex("trainers")
        .where({ document, admin_id })
        .andWhereNot({ id })
        .first();

      if (existingTreinadorWithDocument) {
        throw new AppError("Este documento já está cadastrado", 400);
      }
    }

    const updatedData: any = {
      name: name || treinador.name,
      email: email || treinador.email,
      document: document || treinador.document,
      phone_number: phone_number || treinador.phone_number,
      position: position !== undefined ? position : treinador.position,
      years_of_experience: years_of_experience !== undefined ? years_of_experience : treinador.years_of_experience,
      specialties: specialties !== undefined ? specialties : treinador.specialties,
      academic_background: academic_background !== undefined ? academic_background : treinador.academic_background,
      about_me: about_me !== undefined ? about_me : treinador.about_me,
      instagram: instagram !== undefined ? instagram : treinador.instagram,
      cref: cref !== undefined ? cref : treinador.cref,
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    if (password) {
      updatedData.password = await bcrypt.hash(password, 8);
    }

    await knex("trainers").update(updatedData).where({ id, admin_id });

    const updatedTreinador = await knex("trainers")
      .select(
        "id",
        "admin_id",
        "name",
        "email",
        "document",
        "phone_number",
        "position",
        "years_of_experience",
        "specialties",
        "academic_background",
        "about_me",
        "instagram",
        "cref",
        "created_at",
        "updated_at"
      )
      .where({ id, admin_id })
      .first();

    return res.status(200).json({
      message: "Treinador atualizado com sucesso",
      treinador: updatedTreinador
    });
  }

  /**
   * @swagger
   * /trainers/{id}:
   *   delete:
   *     summary: Delete trainer
   *     tags: [Trainers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: header
   *         name: admin_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Trainer deleted
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id || !id) {
      throw new AppError("É necessário enviar o ID do admin e do treinador", 400);
    }

    const treinador = await knex("trainers").where({ id, admin_id }).first();
    
    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }
    
    await knex("trainers").where({ id, admin_id }).delete();
    
    return res.json({ message: "Treinador excluído com sucesso" });
  }

  /**
   * @swagger
   * /trainers/{id}/contacts:
   *   patch:
   *     summary: Update trainer's contact information
   *     tags: [Trainers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               phone_number:
   *                 type: string
   *               instagram:
   *                 type: string
   *     responses:
   *       200:
   *         description: Trainer contacts updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 treinador:
   *                   $ref: '#/components/schemas/Trainer'
   */
  async updateContacts(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { email, phone_number, instagram } = req.body;
    const admin_id = req.headers.admin_id as string;

    if (!admin_id) {
      throw new AppError("É necessário enviar o ID do admin", 400);
    }

    // Check if trainer exists
    const treinador = await knex("trainers").where({ id, admin_id }).first();
    if (!treinador) {
      throw new AppError("Treinador não encontrado", 404);
    }

    // Check if email is already in use by another trainer
    if (email && email !== treinador.email) {
      const existingTreinadorWithEmail = await knex("trainers")
        .where({ email, admin_id })
        .whereNot({ id })
        .first();

      if (existingTreinadorWithEmail) {
        throw new AppError("Este e-mail já está cadastrado", 400);
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: moment().tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss"),
    };

    // Only update fields that were provided in the request
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (instagram !== undefined) updateData.instagram = instagram;

    // If no valid fields to update
    if (Object.keys(updateData).length <= 1) {
      throw new AppError("Nenhum dado válido para atualização fornecido", 400);
    }

    // Perform the update
    await knex("trainers")
      .where({ id, admin_id })
      .update(updateData);

    // Fetch the updated trainer data
    const updatedTreinador = await knex("trainers")
      .select(
        "id",
        "admin_id",
        "name",
        "email",
        "phone_number",
        "instagram",
        "updated_at"
      )
      .where({ id, admin_id })
      .first();

    return res.status(200).json({
      message: "Contatos do treinador atualizados com sucesso",
      treinador: updatedTreinador
    });
  }
}

export default new TreinadoresController();
