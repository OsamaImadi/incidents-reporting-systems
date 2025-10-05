import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserType } from '../utils/userTypes.enum';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    userType: UserType.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers = [mockUser];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        userType: UserType.USER,
      };

      const req = { user: { id: 1, userType: UserType.ADMIN } };
      usersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto, req);

      expect(result).toEqual(mockUser);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto, req.user);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      usersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, username: 'updateduser' };

      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(1, updateUserDto);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const deleteResponse = {
        message: 'User deleted successfully',
        userId: 1,
      };

      usersService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove('1');

      expect(result).toEqual(deleteResponse);
      expect(usersService.remove).toHaveBeenCalledWith(1);
    });
  });
});