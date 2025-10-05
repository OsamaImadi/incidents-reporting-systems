import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserType } from 'src/utils/userTypes.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminSeed {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async seedAdmin(): Promise<void> {
    const adminEmail = 'admin@incidents.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await this.usersRepository.findOne({
      where: [
        { email: adminEmail },
        { username: adminUsername }
      ],
      select: ['id', 'username', 'email', 'userType']
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = this.usersRepository.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      userType: UserType.ADMIN,
    });

    await this.usersRepository.save(adminUser);
    console.log('Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('User Type:', UserType.ADMIN);
  }
}
