import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordValidatorService {
  private readonly commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
    'qazwsx', 'trustno1', '654321', 'jordan23', 'harley', 'password1',
    '1234', 'robert', 'matthew', 'jordan', 'asshole', 'daniel'
  ];

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be no more than 128 characters long');
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common password check
    if (this.commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    // Sequential characters check
    if (this.hasSequentialCharacters(password)) {
      errors.push('Password contains sequential characters (e.g., abc, 123)');
    }

    // Repeated characters check
    if (this.hasRepeatedCharacters(password)) {
      errors.push('Password contains too many repeated characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private hasSequentialCharacters(password: string): boolean {
    const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    
    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(subseq)) {
          return true;
        }
      }
    }
    return false;
  }

  private hasRepeatedCharacters(password: string): boolean {
    const charCount: { [key: string]: number } = {};
    
    for (const char of password.toLowerCase()) {
      charCount[char] = (charCount[char] || 0) + 1;
      if (charCount[char] > 3) {
        return true;
      }
    }
    return false;
  }

  calculatePasswordStrength(password: string): number {
    let score = 0;
    
    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    
    // Bonus for uncommon patterns
    if (!this.commonPasswords.includes(password.toLowerCase())) score += 1;
    if (!this.hasSequentialCharacters(password)) score += 1;
    if (!this.hasRepeatedCharacters(password)) score += 1;
    
    return Math.min(score, 10); // Max score of 10
  }

  getPasswordStrengthLabel(score: number): string {
    if (score <= 3) return 'Very Weak';
    if (score <= 5) return 'Weak';
    if (score <= 7) return 'Medium';
    if (score <= 9) return 'Strong';
    return 'Very Strong';
  }
}
