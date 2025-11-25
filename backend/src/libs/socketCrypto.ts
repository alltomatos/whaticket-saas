import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Classe para criptografar e descriptografar dados nos sockets
 */
export class SocketCrypto {
  private algorithm: string;
  private secretKey: Buffer;
  private iv: Buffer;

  /**
   * @param secretKey - Chave secreta para criptografia (usa AUTH_SECRET se não fornecida)
   * @param algorithm - Algoritmo de criptografia
   */
  constructor(secretKey?: string, algorithm = 'aes-256-cbc') {
    try {
      // Usar a chave de autenticação do sistema ou uma chave personalizada
      const key = secretKey || process.env.JWT_SECRET || 'whaticket-crypto-secret-key';
      
      // Transformar a chave em um hash de tamanho fixo para o algoritmo
      this.secretKey = crypto
        .createHash('sha256')
        .update(String(key))
        .digest();
      
      // Vetor de inicialização fixo (poderia ser dinâmico em implementação mais robusta)
      this.iv = crypto.randomBytes(16);
      this.algorithm = algorithm;
      
      logger.info('Sistema de criptografia para sockets inicializado');
    } catch (error) {
      logger.error(`Erro ao inicializar sistema de criptografia: ${error.message}`);
      throw new Error('Falha ao inicializar criptografia');
    }
  }

  /**
   * Criptografa dados para envio pelo socket
   * @param data - Dados a serem criptografados
   * @returns Objeto com dados criptografados e IV para descriptografia
   */
  encrypt(data: any): { encryptedData: string, iv: string } {
    try {
      // Converter dados para string JSON
      const text = JSON.stringify(data);
      
      // Criar cipher com o algoritmo e IV
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, this.iv);
      
      // Criptografar os dados
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encryptedData: encrypted,
        iv: this.iv.toString('hex')
      };
    } catch (error) {
      logger.error(`Erro ao criptografar dados: ${error.message}`);
      throw new Error('Falha ao criptografar dados');
    }
  }

  /**
   * Descriptografa dados recebidos pelo socket
   * @param encryptedData - Dados criptografados
   * @param ivHex - Vetor de inicialização usado na criptografia
   * @returns Dados descriptografados
   */
  decrypt(encryptedData: string, ivHex: string): any {
    try {
      // Converter IV de hex para Buffer
      const iv = Buffer.from(ivHex, 'hex');
      
      // Criar decipher com o algoritmo e IV
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      
      // Descriptografar os dados
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Converter de volta para objeto
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error(`Erro ao descriptografar dados: ${error.message}`);
      throw new Error('Falha ao descriptografar dados');
    }
  }

  /**
   * Método para empacotar mensagem e criptografar
   * @param event - Nome do evento
   * @param payload - Dados do evento
   * @returns Pacote criptografado
   */
  encryptPacket(event: string, payload: any): { event: string, encrypted: string, iv: string } {
    const { encryptedData, iv } = this.encrypt(payload);
    return {
      event,
      encrypted: encryptedData,
      iv
    };
  }

  /**
   * Método para descriptografar e desempacotar mensagem
   * @param packet - Pacote criptografado
   * @returns Evento e dados descriptografados
   */
  decryptPacket(packet: { event: string, encrypted: string, iv: string }): { event: string, payload: any } {
    const { event, encrypted, iv } = packet;
    const payload = this.decrypt(encrypted, iv);
    return { event, payload };
  }
} 