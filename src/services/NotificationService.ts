import { Server } from 'socket.io';
import PushNotificationService from './PushNotificationService';

interface NotificationData {
  id: string;
  type: 'feedback' | 'training' | 'general';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

class NotificationService {
  private io: Server;
  private pushService: PushNotificationService;

  constructor(io: Server) {
    this.io = io;
    this.pushService = new PushNotificationService();
  }

  /**
   * Envia notificação para um personal trainer específico
   */
  async sendToPersonalTrainer(treinadorId: number, notification: Omit<NotificationData, 'id' | 'timestamp'>) {
    const notificationData: NotificationData = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...notification
    };

    // Envia para a sala do personal trainer
    this.io.to(`personal_${treinadorId}`).emit('notification', notificationData);
    
    console.log(`📱 Notificação enviada para personal trainer ${treinadorId}:`, notificationData);
    
    return notificationData;
  }

  /**
   * Envia notificação de novo feedback para o personal trainer
   */
  async sendFeedbackNotification(treinadorId: number, feedbackData: any) {
    const notification = {
      type: 'feedback' as const,
      title: 'Novo Feedback Recebido! 💪',
      message: `${feedbackData.cliente_name} enviou um feedback sobre o treino de hoje`,
      data: {
        feedbackId: feedbackData.id,
        clienteId: feedbackData.cliente_id,
        clienteName: feedbackData.cliente_name,
        note: feedbackData.note,
        createdAt: feedbackData.created_at
      }
    };

    // Enviar notificação WebSocket
    const socketResult = await this.sendToPersonalTrainer(treinadorId, notification);
    
    // Enviar notificação push nativa
    try {
      await this.pushService.sendFeedbackNotification(treinadorId, feedbackData);
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
    }

    return socketResult;
  }

  /**
   * Envia notificação geral para um personal trainer
   */
  async sendGeneralNotification(treinadorId: number, title: string, message: string, data?: any) {
    const notification = {
      type: 'general' as const,
      title,
      message,
      data
    };

    return this.sendToPersonalTrainer(treinadorId, notification);
  }

  /**
   * Envia notificação para múltiplos personal trainers
   */
  async sendToMultiplePersonalTrainers(treinadorIds: number[], notification: Omit<NotificationData, 'id' | 'timestamp'>) {
    const promises = treinadorIds.map(id => this.sendToPersonalTrainer(id, notification));
    return Promise.all(promises);
  }

  /**
   * Registra token de push notification
   */
  async registerPushToken(userId: number, userType: 'personal' | 'aluno', pushToken: string) {
    return this.pushService.registerPushToken(userId, userType, pushToken);
  }

  /**
   * Remove token de push notification
   */
  async unregisterPushToken(userId: number, userType: 'personal' | 'aluno') {
    return this.pushService.unregisterPushToken(userId, userType);
  }
}

export default NotificationService;
