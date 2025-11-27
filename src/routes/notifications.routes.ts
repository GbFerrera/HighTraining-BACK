import { Router } from 'express';
import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import NotificationService from '../services/NotificationService';

const notificationsRoutes = Router();

/**
 * @swagger
 * /notifications/register-token:
 *   post:
 *     summary: Registrar token de push notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário
 *               userType:
 *                 type: string
 *                 enum: [personal, aluno]
 *                 description: Tipo de usuário
 *               pushToken:
 *                 type: string
 *                 description: Token de push notification do Expo
 *             required:
 *               - userId
 *               - userType
 *               - pushToken
 *     responses:
 *       200:
 *         description: Token registrado com sucesso
 *       400:
 *         description: Dados inválidos
 */
notificationsRoutes.post('/register-token', async (req: Request, res: Response) => {
  const { userId, userType, pushToken } = req.body;

  // Validações
  if (!userId || !userType || !pushToken) {
    throw new AppError('Todos os campos são obrigatórios: userId, userType, pushToken', 400);
  }

  if (!['personal', 'aluno'].includes(userType)) {
    throw new AppError('userType deve ser "personal" ou "aluno"', 400);
  }

  if (isNaN(Number(userId))) {
    throw new AppError('userId deve ser um número válido', 400);
  }

  try {
    const notificationService = req.app.get('notificationService') as NotificationService;
    const success = await notificationService.registerPushToken(Number(userId), userType, pushToken);

    if (success) {
      return res.json({ 
        message: 'Token de push registrado com sucesso',
        userId: Number(userId),
        userType 
      });
    } else {
      throw new AppError('Erro ao registrar token de push', 500);
    }
  } catch (error: any) {
    throw new AppError(error.message || 'Erro interno do servidor', 500);
  }
});

/**
 * @swagger
 * /notifications/unregister-token:
 *   post:
 *     summary: Remover token de push notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID do usuário
 *               userType:
 *                 type: string
 *                 enum: [personal, aluno]
 *                 description: Tipo de usuário
 *             required:
 *               - userId
 *               - userType
 *     responses:
 *       200:
 *         description: Token removido com sucesso
 *       400:
 *         description: Dados inválidos
 */
notificationsRoutes.post('/unregister-token', async (req: Request, res: Response) => {
  const { userId, userType } = req.body;

  // Validações
  if (!userId || !userType) {
    throw new AppError('Todos os campos são obrigatórios: userId, userType', 400);
  }

  if (!['personal', 'aluno'].includes(userType)) {
    throw new AppError('userType deve ser "personal" ou "aluno"', 400);
  }

  if (isNaN(Number(userId))) {
    throw new AppError('userId deve ser um número válido', 400);
  }

  try {
    const notificationService = req.app.get('notificationService') as NotificationService;
    const success = await notificationService.unregisterPushToken(Number(userId), userType);

    if (success) {
      return res.json({ 
        message: 'Token de push removido com sucesso',
        userId: Number(userId),
        userType 
      });
    } else {
      throw new AppError('Erro ao remover token de push', 500);
    }
  } catch (error: any) {
    throw new AppError(error.message || 'Erro interno do servidor', 500);
  }
});

/**
 * @swagger
 * /notifications/test:
 *   post:
 *     summary: Testar notificação push (desenvolvimento)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               treinadorId:
 *                 type: integer
 *                 description: ID do personal trainer
 *             required:
 *               - treinadorId
 *     responses:
 *       200:
 *         description: Notificação de teste enviada
 */
notificationsRoutes.post('/test', async (req: Request, res: Response) => {
  const { treinadorId } = req.body;

  if (!treinadorId || isNaN(Number(treinadorId))) {
    throw new AppError('treinadorId deve ser um número válido', 400);
  }

  try {
    const notificationService = req.app.get('notificationService') as NotificationService;
    
    // Enviar notificação de teste
    await notificationService.sendGeneralNotification(
      Number(treinadorId),
      '🧪 Teste de Notificação',
      'Esta é uma notificação de teste para verificar se o sistema está funcionando!'
    );

    return res.json({ 
      message: 'Notificação de teste enviada com sucesso',
      treinadorId: Number(treinadorId)
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Erro interno do servidor', 500);
  }
});

export default notificationsRoutes;
