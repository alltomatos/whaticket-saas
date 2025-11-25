import { logger } from "../utils/logger";

interface RateLimitEntry {
  count: number;
  timestamp: number;
}

/**
 * Gerenciador de rate limiting para WebSockets
 * Limita o número de eventos que um usuário pode enviar em determinado período
 */
export class SocketRateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly cleanupInterval: NodeJS.Timeout;

  /**
   * @param windowMs - Janela de tempo em milissegundos
   * @param maxRequests - Número máximo de requisições na janela de tempo
   * @param cleanupIntervalMs - Intervalo para limpeza de entradas expiradas
   */
  constructor(windowMs = 1000, maxRequests = 10, cleanupIntervalMs = 60000) {
    this.limits = new Map<string, RateLimitEntry>();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Limpar entradas antigas periodicamente para evitar vazamento de memória
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  /**
   * Verifica se um usuário excedeu o limite para um determinado evento
   * @param userId - ID do usuário
   * @param event - Nome do evento
   * @returns true se o usuário excedeu o limite, false caso contrário
   */
  isRateLimited(userId: string, event: string): boolean {
    const key = `${userId}:${event}`;
    const now = Date.now();
    
    if (!this.limits.has(key)) {
      this.limits.set(key, {
        count: 1,
        timestamp: now
      });
      return false;
    }
    
    const limit = this.limits.get(key);
    
    // Se passou da janela de tempo, reinicia contador
    if (now - limit.timestamp > this.windowMs) {
      this.limits.set(key, {
        count: 1,
        timestamp: now
      });
      return false;
    }
    
    // Verifica se excedeu o limite na janela de tempo atual
    if (limit.count >= this.maxRequests) {
      logger.warn(`Rate limit excedido para ${userId} no evento ${event}`);
      return true;
    }
    
    // Incrementa contador
    limit.count++;
    this.limits.set(key, limit);
    return false;
  }

  /**
   * Remove entradas expiradas do mapa de limites
   */
  private cleanup(): void {
    const now = Date.now();
    
    this.limits.forEach((limit, key) => {
      if (now - limit.timestamp > this.windowMs * 2) {
        this.limits.delete(key);
      }
    });
  }

  /**
   * Libera recursos ao encerrar a aplicação
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
} 