import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize input
    const sanitizedValue = this.sanitizeInput(value);
    
    const object = plainToClass(metatype, sanitizedValue);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    return sanitizedValue;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeInput(item));
    }
    
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeInput(value[key]);
        }
      }
      return sanitized;
    }
    
    return value;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;
    
    return str
      // Remove potential XSS vectors
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Remove SQL injection patterns
      .replace(/('|(\\')|(;)|(\-\-)|(\/\*)|(\*\/)|(\|)|(\*)|(%)|(\+)|(\=)|(\()|(\))|(\[)|(\])|(\{)|(\})|(\;)|(\:)|(\')|(\")|(\<)|(\>)|(\,)|(\?)|(\!)|(\@)|(\#)|(\$)|(\^)|(\&)|(\*)|(\()|(\))|(\+)|(\=)|(\[)|(\])|(\{)|(\})|(\;)|(\:)|(\')|(\")|(\<)|(\>)|(\,)|(\?)|(\!)|(\@)|(\#)|(\$)|(\^)|(\&))/g, '')
      // Trim whitespace
      .trim()
      // Limit length to prevent buffer overflow
      .substring(0, 10000);
  }
}
