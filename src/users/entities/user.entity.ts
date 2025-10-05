import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserType } from 'src/utils/userTypes.enum';
import { Incident } from 'src/incidents/entities/incident.entity';


@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.USER })
  userType: UserType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Incident, (incident) => incident.created_by)
  incidents: Incident[];

  @BeforeInsert()
  async hashPasswordBeforeInsert(): Promise<void> {
    if (this.password && !this.isBcryptHash(this.password)) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordBeforeUpdate(): Promise<void> {
    if (this.password && !this.isBcryptHash(this.password)) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  private isBcryptHash(value: string): boolean {
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
  }
}
