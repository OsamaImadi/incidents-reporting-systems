import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly secretKey: string;

  constructor() {
    // Use environment variable or fallback to a default key
    this.secretKey = process.env.ENCRYPTION_KEY || 'your-default-encryption-key-change-this-in-production';
  }

  encrypt(text: string): string {
    if (!text) return text;
    
    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.secretKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.secretKey);
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error('Invalid encrypted data');
      }
      
      return decryptedText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}
