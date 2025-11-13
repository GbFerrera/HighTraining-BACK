import { Router } from 'express';
import SessionController from '../controllers/SessionController';

const sessionsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Autenticação de usuários
 */

// Login
sessionsRoutes.post('/login', SessionController.login);

// Registro
sessionsRoutes.post('/register', SessionController.register);

// Validação de token
sessionsRoutes.get('/validate', SessionController.validate);

export default sessionsRoutes;
