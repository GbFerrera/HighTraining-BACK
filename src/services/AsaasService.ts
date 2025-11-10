import axios, { AxiosInstance } from 'axios';

interface Customer {
  name: string;
  phone: string;
}

interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  pixQrCode?: string;
  pixCodeId?: string;
  status?: string;
  error?: any;
}

interface PaymentStatusResponse {
  success: boolean;
  status?: string;
  error?: any;
}

class AsaasService {
  private baseURL: string;
  private api: AxiosInstance;

  constructor(apiKey: string) {
    this.baseURL = 'https://api.asaas.com/v3';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'access_token': apiKey
      }
    });
  }

  async generatePixPayment(orderId: number, value: number, customer: Customer): Promise<PaymentResponse> {
    try {
      // Cria ou atualiza o cliente
      const customerResponse = await this.api.post('/customers', {
        name: customer.name,
        phone: customer.phone
      });

      // Gera o pagamento PIX
      const paymentResponse = await this.api.post('/payments', {
        customer: customerResponse.data.id,
        billingType: 'PIX',
        value: value,
        externalReference: orderId.toString(),
        description: `Pedido #${orderId}`,
      });

      // Retorna os dados do PIX
      return {
        success: true,
        paymentId: paymentResponse.data.id,
        pixQrCode: paymentResponse.data.pixQrCode,
        pixCodeId: paymentResponse.data.pixCodeId,
        status: paymentResponse.data.status
      };
    } catch (error: any) {
      console.error('Erro ao gerar pagamento PIX:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await this.api.get(`/payments/${paymentId}`);
      return {
        success: true,
        status: response.data.status
      };
    } catch (error: any) {
      console.error('Erro ao consultar status do pagamento:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message
      };
    }
  }
}

export default AsaasService;
