import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt', () => {
    it('should encrypt text', () => {
      const text = 'sensitive data';
      const encrypted = service.encrypt(text);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(text);
      expect(typeof encrypted).toBe('string');
    });

    it('should return different encrypted values for same input', () => {
      const text = 'sensitive data';
      const encrypted1 = service.encrypt(text);
      const encrypted2 = service.encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text', () => {
      const originalText = 'sensitive data';
      const encrypted = service.encrypt(originalText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle empty string', () => {
      const originalText = '';
      const encrypted = service.encrypt(originalText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle special characters', () => {
      const originalText = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(originalText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });
  });

  describe('round trip encryption', () => {
    it('should maintain data integrity through encrypt/decrypt cycle', () => {
      const testCases = [
        'simple text',
        'text with numbers 123456',
        'text with special chars !@#$%^&*()',
        'multiline\ntext\nwith\nbreaks',
        'unicode text: 你好世界 🌍',
        '',
        'a'.repeat(1000), // long text
      ];

      testCases.forEach((testCase) => {
        const encrypted = service.encrypt(testCase);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
