/**
 * Classe utilitária para validação de payloads em eventos WebSocket
 */
export class PayloadValidator {
  /**
   * Valida o payload de um evento WebSocket
   * @param eventName Nome do evento
   * @param payload Dados do evento
   * @throws Error se o payload for inválido
   */
  static validateEventPayload(eventName: string, payload: any): void {
    switch (eventName) {
      case 'joinChatBox':
      case 'leaveChatBox':
        PayloadValidator.validateTicketId(payload);
        break;
      
      case 'joinTickets':
      case 'leaveTickets':
        PayloadValidator.validateTicketStatus(payload);
        break;
        
      case 'joinNotification':
      case 'leaveNotification':
        // Eventos sem payload
        break;
        
      default:
        // Para outros eventos, adicionar validações específicas conforme necessário
        break;
    }
  }
  
  /**
   * Valida ID de ticket
   * @param ticketId ID do ticket
   * @throws Error se o ID for inválido
   */
  private static validateTicketId(ticketId: any): void {
    if (typeof ticketId !== 'string') {
      throw new Error('Ticket ID deve ser uma string');
    }
    
    if (ticketId === 'undefined' || ticketId === 'null' || !ticketId) {
      throw new Error('Ticket ID não pode ser vazio');
    }
    
    // Evitar IDs muito longos para prevenir ataques de DoS
    if (ticketId.length > 100) {
      throw new Error('Ticket ID é muito longo');
    }
  }
  
  /**
   * Valida status de ticket
   * @param status Status do ticket
   * @throws Error se o status for inválido
   */
  private static validateTicketStatus(status: any): void {
    if (typeof status !== 'string') {
      throw new Error('Status deve ser uma string');
    }
    
    const validStatuses = ['open', 'pending', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status inválido: ${status}`);
    }
  }
} 