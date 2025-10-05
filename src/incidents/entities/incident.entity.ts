import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, AfterLoad } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import * as CryptoJS from 'crypto-js';
import { Severity } from 'src/utils/severity.enum';

@Entity({ name: 'incidents' })
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  url: string;

  @Column({ name: 'http_response', type: 'text', nullable: true })
  httpResponse?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  // Store the original description for encryption/decryption
  private _description?: string | null;

  @Column({ type: 'enum', enum: Severity, default: Severity.LOW })
  severity: Severity;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  created_by: User;

  @Column({ type: 'text', name: 'screenshot_url', nullable: true })
  screenshotUrl?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  private getEncryptionKey(): string {
    return process.env.ENCRYPTION_KEY || 'your-default-encryption-key-change-this-in-production';
  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptDescription(): void {
    if (this.description && !this.isEncrypted(this.description)) {
      this.description = this.encrypt(this.description);
    }
  }

  @AfterLoad()
  decryptDescription(): void {
    if (this.description && this.isEncrypted(this.description)) {
      this._description = this.description; // Store encrypted version
      this.description = this.decrypt(this.description);
    }
  }

  private encrypt(text: string): string {
    try {
      return CryptoJS.AES.encrypt(text, this.getEncryptionKey()).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Return original text if encryption fails
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.getEncryptionKey());
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      return decryptedText || encryptedText; 
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; 
    }
  }

  private isEncrypted(text: string): boolean {
    return text.length > 20 && /^[A-Za-z0-9+/=]+$/.test(text);
  }

  getEncryptedDescription(): string | null {
    return this._description || this.description || null;
  }
}
