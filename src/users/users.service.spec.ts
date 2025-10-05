import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserType } from '../utils/userTypes.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    userType: UserType.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    incidents: []
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            preload: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        userType: UserType.USER,
      };

      repository.create.mockReturnValue(mockUser as any);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should allow admin to create admin user', async () => {
      const createUserDto = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        userType: UserType.ADMIN,
      };

      const currentUser = { ...mockUser, userType: UserType.ADMIN };
      const newAdminUser = { ...mockUser, userType: UserType.ADMIN };

      repository.create.mockReturnValue(newAdminUser as any);
      repository.save.mockResolvedValue(newAdminUser);

      const result = await service.create(createUserDto, currentUser);

      expect(result).toEqual(newAdminUser);
    });

    it('should throw ForbiddenException when non-admin tries to create admin', async () => {
      const createUserDto = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'password123',
        userType: UserType.ADMIN,
      };

      const currentUser = { ...mockUser, userType: UserType.USER };

      await expect(service.create(createUserDto, currentUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const createUserDto = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new Error('Unique constraint violation');
      (error as any).code = '23505';
      (error as any).detail = 'Key (email)=(existing@example.com) already exists.';

      repository.create.mockReturnValue(mockUser as any);
      repository.save.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      repository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user with password field', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: ['id', 'username', 'email', 'password', 'userType', 'createdAt', 'updatedAt']
      });
    });
  });

  describe('findByUsername', () => {
    it('should return user with password field', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: ['id', 'username', 'email', 'password', 'userType', 'createdAt', 'updatedAt']
      });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, username: 'updateduser' };

      repository.preload.mockResolvedValue(updatedUser as any);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(repository.preload).toHaveBeenCalledWith({ id: 1, ...updateUserDto });
    });

    it('should throw NotFoundException when user not found', async () => {
      const updateUserDto = { username: 'updateduser' };

      repository.preload.mockResolvedValue(null);

      await expect(service.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      const updateUserDto = { email: 'existing@example.com' };

      const error = new Error('Unique constraint violation');
      (error as any).code = '23505';
      (error as any).detail = 'Key (email)=(existing@example.com) already exists.';

      repository.preload.mockResolvedValue(mockUser as any);
      repository.save.mockRejectedValue(error);

      await expect(service.update(1, updateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a user and return success message', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove(1);

      expect(result).toEqual({
        message: 'User deleted successfully',
        userId: 1
      });
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});