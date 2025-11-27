import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import knex from '../database/knex';

interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: 'default' | null;
  badge?: number;
}

class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  /**
   * Registra o token de push notification de um usuário
   */
  async registerPushToken(userId: number, userType: 'personal' | 'aluno', pushToken: string) {
    try {
      // Verificar se o token é válido
      if (!Expo.isExpoPushToken(pushToken)) {
        throw new Error('Token de push notification inválido');
      }

      // Verificar se já existe um registro para este usuário
      const existingToken = await knex('push_tokens')
        .where({ user_id: userId, user_type: userType })
        .first();

      if (existingToken) {
        // Atualizar token existente
        await knex('push_tokens')
          .where({ user_id: userId, user_type: userType })
          .update({
            push_token: pushToken,
            updated_at: knex.fn.now()
          });
      } else {
        // Criar novo registro
        await knex('push_tokens').insert({
          user_id: userId,
          user_type: userType,
          push_token: pushToken,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      }

      console.log(`📱 Token de push registrado para ${userType} ${userId}`);
      return true;
    } catch (error) {
      console.error('Erro ao registrar token de push:', error);
      return false;
    }
  }

  /**
   * Remove o token de push notification de um usuário
   */
  async unregisterPushToken(userId: number, userType: 'personal' | 'aluno') {
    try {
      await knex('push_tokens')
        .where({ user_id: userId, user_type: userType })
        .delete();

      console.log(`📱 Token de push removido para ${userType} ${userId}`);
      return true;
    } catch (error) {
      console.error('Erro ao remover token de push:', error);
      return false;
    }
  }

  /**
   * Envia notificação push para um personal trainer específico
   */
  async sendToPersonalTrainer(treinadorId: number, notification: PushNotificationData) {
    try {
      // Buscar tokens do personal trainer
      const tokens = await knex('push_tokens')
        .where({ user_id: treinadorId, user_type: 'personal' })
        .select('push_token');

      if (tokens.length === 0) {
        console.log(`Nenhum token de push encontrado para personal trainer ${treinadorId}`);
        return [];
      }

      const messages: ExpoPushMessage[] = tokens.map(tokenRow => ({
        to: tokenRow.push_token,
        sound: notification.sound || 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
      }));

      // Enviar notificações
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Erro ao enviar chunk de notificações:', error);
        }
      }

      // Log dos resultados
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          console.error(`Erro na notificação ${index}:`, ticket.message);
        } else {
          console.log(`✅ Notificação ${index} enviada com sucesso`);
        }
      });

      return tickets;
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
      return [];
    }
  }

  /**
   * Envia notificação push para um aluno específico
   */
  async sendToAluno(alunoId: number, notification: PushNotificationData) {
    try {
      // Buscar tokens do aluno
      const tokens = await knex('push_tokens')
        .where({ user_id: alunoId, user_type: 'aluno' })
        .select('push_token');

      if (tokens.length === 0) {
        console.log(`Nenhum token de push encontrado para aluno ${alunoId}`);
        return [];
      }

      const messages: ExpoPushMessage[] = tokens.map(tokenRow => ({
        to: tokenRow.push_token,
        sound: notification.sound || 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
      }));

      // Enviar notificações
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Erro ao enviar chunk de notificações:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
      return [];
    }
  }

  /**
   * Envia notificação de feedback para personal trainer
   */
  async sendFeedbackNotification(treinadorId: number, feedbackData: any) {
    const notification: PushNotificationData = {
      title: '💪 Novo Feedback Recebido!',
      body: `${feedbackData.cliente_name} enviou um feedback sobre o treino de hoje`,
      data: {
        type: 'feedback',
        feedbackId: feedbackData.id,
        clienteId: feedbackData.cliente_id,
        clienteName: feedbackData.cliente_name,
        screen: 'FeedbackDetails', // Para navegação no app
      },
      sound: 'default',
      badge: 1,
    };

    return this.sendToPersonalTrainer(treinadorId, notification);
  }

  /**
   * Envia notificação de novo treino para aluno
   */
  async sendTrainingNotification(alunoId: number, trainingData: any) {
    const notification: PushNotificationData = {
      title: '🏋️ Novo Treino Disponível!',
      body: `Seu personal trainer criou um novo treino para você`,
      data: {
        type: 'training',
        trainingId: trainingData.id,
        screen: 'TrainingDetails',
      },
      sound: 'default',
      badge: 1,
    };

    return this.sendToAluno(alunoId, notification);
  }

  /**
   * Limpa tokens inválidos do banco de dados
   */
  async cleanupInvalidTokens() {
    try {
      // Esta função pode ser chamada periodicamente para limpar tokens inválidos
      // Por enquanto, apenas log
      console.log('🧹 Limpeza de tokens inválidos executada');
    } catch (error) {
      console.error('Erro na limpeza de tokens:', error);
    }
  }
}

export default PushNotificationService;
