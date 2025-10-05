import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog, AuditAction, AuditStatus } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { UserType } from '../utils/userTypes.enum';

describe('AuditService', () => {
  let service: AuditService;
  let repository: jest.Mocked<Repository<AuditLog>>;

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

  const mockAuditLog: AuditLog = {
    id: 1,
    user: mockUser,
    action: AuditAction.LOGIN_SUCCESS,
    description: 'User logged in successfully',
    status: AuditStatus.SUCCESS,
    metadata: { ipAddress: '192.168.1.1' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save audit log', async () => {
      const logData = {
        user: mockUser,
        action: AuditAction.LOGIN_SUCCESS,
        description: 'User logged in successfully',
        status: AuditStatus.SUCCESS,
        metadata: { ipAddress: '192.168.1.1' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      repository.create.mockReturnValue(mockAuditLog as any);
      repository.save.mockResolvedValue(mockAuditLog);

      await service.log(logData);

      expect(repository.create).toHaveBeenCalledWith(logData);
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
    });

    it('should handle errors gracefully', async () => {
      const logData = {
        user: mockUser,
        action: AuditAction.LOGIN_SUCCESS,
        description: 'User logged in successfully',
        status: AuditStatus.SUCCESS,
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      repository.create.mockReturnValue(mockAuditLog as any);
      repository.save.mockRejectedValue(new Error('Database error'));

      await service.log(logData);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to log audit event:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getLogs', () => {
    it('should return audit logs with default pagination', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getLogs();

      expect(result).toEqual([mockAuditLog]);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('should filter by user id', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getLogs(1);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.user.id = :userId', { userId: 1 });
    });

    it('should filter by action', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getLogs(undefined, AuditAction.LOGIN_SUCCESS);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.action = :action',
        { action: AuditAction.LOGIN_SUCCESS }
      );
    });

    it('should filter by status', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getLogs(undefined, undefined, AuditStatus.SUCCESS);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.status = :status',
        { status: AuditStatus.SUCCESS }
      );
    });

    it('should apply custom pagination', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getLogs(undefined, undefined, undefined, 10, 20);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
    });

    it('should combine multiple filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getLogs(1, AuditAction.LOGIN_SUCCESS, AuditStatus.SUCCESS, 5, 10);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.user.id = :userId', { userId: 1 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.action = :action',
        { action: AuditAction.LOGIN_SUCCESS }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.status = :status',
        { status: AuditStatus.SUCCESS }
      );
    });
  });
});
