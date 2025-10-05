import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { UserType } from '../utils/userTypes.enum';
import { AuditAction, AuditStatus } from './entities/audit-log.entity';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    userType: UserType.USER,
  };

  const mockAdminUser = {
    ...mockUser,
    userType: UserType.ADMIN,
  };

  const mockAuditLog = {
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

  const mockAuditLogs = [mockAuditLog];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            getLogs: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogs', () => {
    it('should return audit logs for admin', async () => {
      const query = {
        userId: '1',
        action: AuditAction.LOGIN_SUCCESS,
        status: AuditStatus.SUCCESS,
        limit: '10',
        offset: '0',
      };

      auditService.getLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getLogs(
        query.userId,
        query.action,
        query.status,
        query.limit,
        query.offset
      );

      expect(result).toEqual(mockAuditLogs);
      expect(auditService.getLogs).toHaveBeenCalledWith(
        1,
        AuditAction.LOGIN_SUCCESS,
        AuditStatus.SUCCESS,
        10,
        0
      );
    });

    it('should use default pagination values', async () => {
      auditService.getLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getLogs();

      expect(result).toEqual(mockAuditLogs);
      expect(auditService.getLogs).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        20,
        0
      );
    });
  });

  describe('getMyLogs', () => {
    it('should return user audit logs', async () => {
      const req = { user: mockUser };
      const query = {
        action: AuditAction.LOGIN_SUCCESS,
        status: AuditStatus.SUCCESS,
        limit: '10',
        offset: '0',
      };

      auditService.getLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getMyLogs(
        req,
        query.action,
        query.status,
        query.limit,
        query.offset
      );

      expect(result).toEqual(mockAuditLogs);
      expect(auditService.getLogs).toHaveBeenCalledWith(
        mockUser.id,
        AuditAction.LOGIN_SUCCESS,
        AuditStatus.SUCCESS,
        10,
        0
      );
    });

    it('should use default pagination values for user logs', async () => {
      const req = { user: mockUser };
      auditService.getLogs.mockResolvedValue(mockAuditLogs);

      const result = await controller.getMyLogs(req);

      expect(result).toEqual(mockAuditLogs);
      expect(auditService.getLogs).toHaveBeenCalledWith(
        mockUser.id,
        undefined,
        undefined,
        20,
        0
      );
    });
  });
});
