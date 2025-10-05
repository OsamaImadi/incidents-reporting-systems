import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserType } from 'src/utils/userTypes.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser?: User): Promise<User> {
    try {
      // Check if trying to create admin user
      if (createUserDto.userType === UserType.ADMIN) {
        // Only existing admins can create new admin users
        if (!currentUser || currentUser.userType !== UserType.ADMIN) {
          throw new ForbiddenException('Only existing admins can create new admin users');
        }
      }

      const user = this.usersRepository.create(createUserDto);
      return await this.usersRepository.save(user);
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation error code
        if (error.detail?.includes('email')) {
          throw new ConflictException('User with this email already exists');
        }
        if (error.detail?.includes('username')) {
          throw new ConflictException('User with this username already exists');
        }
        throw new ConflictException('User with this information already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const preloaded = await this.usersRepository.preload({ id, ...updateUserDto });
      if (!preloaded) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      return await this.usersRepository.save(preloaded);
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') { // PostgreSQL unique violation error code
        if (error.detail?.includes('email')) {
          throw new ConflictException('User with this email already exists');
        }
        if (error.detail?.includes('username')) {
          throw new ConflictException('User with this username already exists');
        }
        throw new ConflictException('User with this information already exists');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ message: string; userId: number }> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return {
      message: 'User deleted successfully',
      userId: id
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'username', 'email', 'password', 'userType', 'createdAt', 'updatedAt']
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ 
      where: { username },
      select: ['id', 'username', 'email', 'password', 'userType', 'createdAt', 'updatedAt']
    });
  }
}
