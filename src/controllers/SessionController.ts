import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import knex from '../database/knex';
import AppError from '../utils/AppError';
import authConfig from '../configs/auth';

interface LoginDTO {
  email: string;
  password: string;
  userType: 'personal' | 'aluno';
}

interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  userType: 'personal' | 'aluno';
  document?: string;
  position?: string;
}

class SessionController {
  /**
   * @swagger
   * /sessions/login:
   *   post:
   *     summary: Login de Personal ou Aluno
   *     tags: [Sessions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, userType]
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               userType:
   *                 type: string
   *                 enum: [personal, aluno]
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   */
  async login(req: Request, res: Response): Promise<Response> {
    const { email, password, userType } = req.body as LoginDTO;

    if (!email || !password || !userType) {
      throw new AppError("Email, senha e tipo de usuário são obrigatórios", 400);
    }

    if (userType !== 'personal' && userType !== 'aluno') {
      throw new AppError("Tipo de usuário inválido", 400);
    }

    // Busca usuário na tabela apropriada
    const table = userType === 'personal' ? 'trainers' : 'students';
    const user = await knex(table)
      .where({ email })
      .first();

    if (!user) {
      throw new AppError("Email ou senha incorretos", 401);
    }

    // Verifica senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new AppError("Email ou senha incorretos", 401);
    }

    // Gera token JWT
    const token = sign(
      { userType, sub: String(user.id) },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.expiresIn,
      }
    );

    // Remove senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      user: userWithoutPassword,
      token,
      userType,
    });
  }

  /**
   * @swagger
   * /sessions/register:
   *   post:
   *     summary: Registro de novo Personal ou Aluno
   *     tags: [Sessions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password, userType]
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               phone_number:
   *                 type: string
   *               userType:
   *                 type: string
   *                 enum: [personal, aluno]
   *               document:
   *                 type: string
   *                 description: Obrigatório para Personal
   *               position:
   *                 type: string
   *                 description: Opcional para Personal
   *     responses:
   *       201:
   *         description: Registro realizado com sucesso
   */
  async register(req: Request, res: Response): Promise<Response> {
    const { name, email, password, phone_number, userType, document, position } = req.body as RegisterDTO;

    if (!name || !email || !password || !userType) {
      throw new AppError("Nome, email, senha e tipo de usuário são obrigatórios", 400);
    }

    if (userType !== 'personal' && userType !== 'aluno') {
      throw new AppError("Tipo de usuário inválido", 400);
    }

    // Apenas Personal pode se registrar publicamente
    if (userType === 'aluno') {
      throw new AppError("Alunos não podem criar conta. Entre em contato com seu Personal Trainer", 403);
    }

    // Para Personal, documento é obrigatório
    if (userType === 'personal' && !document) {
      throw new AppError("Documento é obrigatório para Personal", 400);
    }

    const table = userType === 'personal' ? 'trainers' : 'students';
    
    // Verifica se email já está em uso
    const emailExists = await knex(table)
      .where({ email })
      .first();

    if (emailExists) {
      throw new AppError("Este email já está cadastrado", 400);
    }

    // Para Personal, verifica se documento já está em uso
    if (userType === 'personal' && document) {
      const documentExists = await knex('trainers')
        .where({ document })
        .first();

      if (documentExists) {
        throw new AppError("Este documento já está cadastrado", 400);
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 8);

    // Dados para inserção
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      phone_number: phone_number || null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    };

    // Adiciona campos específicos de Personal
    if (userType === 'personal') {
      userData.document = document;
      userData.position = position || null;
      userData.admin_id = 1; // Admin fixo
    } else {
      // Campos específicos de Aluno
      userData.admin_id = 1; // Admin fixo
      userData.treinador_id = null;
    }

    // Insere usuário
    const [user] = await knex(table)
      .insert(userData)
      .returning(['id', 'name', 'email', 'phone_number', 'created_at', 'updated_at']);

    // Gera token JWT
    const token = sign(
      { userType, sub: String(user.id) },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.expiresIn,
      }
    );

    return res.status(201).json({
      user,
      token,
      userType,
    });
  }

  /**
   * @swagger
   * /sessions/validate:
   *   get:
   *     summary: Valida token JWT e retorna dados do usuário
   *     tags: [Sessions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Token válido
   */
  async validate(req: Request, res: Response): Promise<Response> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("Token não informado", 401);
    }

    const [, token] = authHeader.split(" ");

    try {
      const { verify } = require('jsonwebtoken');
      const decoded = verify(token, authConfig.jwt.secret) as any;
      
      const userId = decoded.sub;
      const userType = decoded.userType;

      // Busca usuário na tabela apropriada
      const table = userType === 'personal' ? 'trainers' : 'students';
      const user = await knex(table)
        .where({ id: userId })
        .first();

      if (!user) {
        throw new AppError("Usuário não encontrado", 404);
      }

      // Remove senha do retorno
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        user: userWithoutPassword,
        userType,
      });
    } catch (error) {
      throw new AppError("Token inválido", 401);
    }
  }
}

export default new SessionController();
