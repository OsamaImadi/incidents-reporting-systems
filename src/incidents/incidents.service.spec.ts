import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident } from './entities/incident.entity';
import { User } from '../users/entities/user.entity';
import { UserType } from '../utils/userTypes.enum';
import { Severity } from '../utils/severity.enum';
import { QueryIncidentsDto } from './dto/query-incidents.dto';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let incidentsRepository: jest.Mocked<Repository<Incident>>;
  let usersRepository: jest.Mocked<Repository<User>>;

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

  const mockAdminUser: User = {
    ...mockUser,
    id: 2,
    userType: UserType.ADMIN,
  };

  const mockIncident: Incident = {
    id: 1,
    url: 'https://malicious-site.com',
    httpResponse: '200 OK',
    description: 'Malicious website detected',
    severity: Severity.HIGH,
    timestamp: new Date(),
    created_by: mockUser,
    screenshotUrl: 'https://screenshot.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getRepositoryToken(Incident),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            preload: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    incidentsRepository = module.get(getRepositoryToken(Incident));
    usersRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new incident for current user', async () => {
      const createIncidentDto = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: Severity.HIGH,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      incidentsRepository.create.mockReturnValue(mockIncident as any);
      incidentsRepository.save.mockResolvedValue(mockIncident);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIncident);

      const result = await service.create(createIncidentDto, mockUser);

      expect(result).toEqual(mockIncident);
      expect(incidentsRepository.create).toHaveBeenCalledWith({
        ...createIncidentDto,
        created_by: mockUser,
      });
    });

    it('should allow admin to create incident for any user', async () => {
      const createIncidentDto = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: Severity.HIGH,
        createdByUserId: 1,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      incidentsRepository.create.mockReturnValue(mockIncident as any);
      incidentsRepository.save.mockResolvedValue(mockIncident);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIncident);

      const result = await service.create(createIncidentDto, mockAdminUser);

      expect(result).toEqual(mockIncident);
      expect(incidentsRepository.create).toHaveBeenCalledWith({
        url: createIncidentDto.url,
        description: createIncidentDto.description,
        severity: createIncidentDto.severity,
        created_by: mockUser,
      });
    });

    it('should throw ForbiddenException when user tries to create incident for another user', async () => {
      const createIncidentDto = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: Severity.HIGH,
        createdByUserId: 2,
      };

      await expect(service.create(createIncidentDto, mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException when target user not found', async () => {
      const createIncidentDto = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: Severity.HIGH,
        createdByUserId: 999,
      };

      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createIncidentDto, mockAdminUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findAll', () => {
    it('should return all incidents for admin', async () => {
      const incidents = [mockIncident];
      incidentsRepository.find.mockResolvedValue(incidents);

      const result = await service.findAll(mockAdminUser);

      expect(result).toEqual(incidents);
      expect(incidentsRepository.find).toHaveBeenCalledWith({
        relations: { created_by: true }
      });
    });

    it('should return only user incidents for regular user', async () => {
      const incidents = [mockIncident];
      incidentsRepository.find.mockResolvedValue(incidents);

      const result = await service.findAll(mockUser);

      expect(result).toEqual(incidents);
      expect(incidentsRepository.find).toHaveBeenCalledWith({
        where: { created_by: { id: mockUser.id } },
        relations: { created_by: true }
      });
    });
  });

  describe('findOne', () => {
    it('should return incident for admin', async () => {
      incidentsRepository.findOne.mockResolvedValue(mockIncident);

      const result = await service.findOne(1, mockAdminUser);

      expect(result).toEqual(mockIncident);
    });

    it('should return incident for owner', async () => {
      incidentsRepository.findOne.mockResolvedValue(mockIncident);

      const result = await service.findOne(1, mockUser);

      expect(result).toEqual(mockIncident);
    });

    it('should throw ForbiddenException when user tries to access another user incident', async () => {
      const otherUserIncident = { ...mockIncident, created_by: { ...mockUser, id: 2 } };
      incidentsRepository.findOne.mockResolvedValue(otherUserIncident);

      await expect(service.findOne(1, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when incident not found', async () => {
      incidentsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('should return user incidents for admin', async () => {
      const incidents = [mockIncident];
      usersRepository.findOne.mockResolvedValue(mockUser);
      incidentsRepository.find.mockResolvedValue(incidents);

      const result = await service.findByUser(1, mockAdminUser);

      expect(result).toEqual(incidents);
      expect(incidentsRepository.find).toHaveBeenCalledWith({
        where: { created_by: { id: 1 } },
        relations: { created_by: true }
      });
    });

    it('should return own incidents for regular user', async () => {
      const incidents = [mockIncident];
      usersRepository.findOne.mockResolvedValue(mockUser);
      incidentsRepository.find.mockResolvedValue(incidents);

      const result = await service.findByUser(1, mockUser);

      expect(result).toEqual(incidents);
    });

    it('should throw ForbiddenException when user tries to access another user incidents', async () => {
      usersRepository.findOne.mockResolvedValue({ ...mockUser, id: 2 });

      await expect(service.findByUser(2, mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when target user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUser(999, mockAdminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update incident for owner', async () => {
      const updateIncidentDto = { description: 'Updated description' };
      const updatedIncident = { ...mockIncident, description: 'Updated description' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockIncident);
      incidentsRepository.preload.mockResolvedValue(updatedIncident as any);
      incidentsRepository.save.mockResolvedValue(updatedIncident);
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedIncident);

      const result = await service.update(1, updateIncidentDto, mockUser);

      expect(result).toEqual(updatedIncident);
    });

    it('should allow admin to change incident ownership', async () => {
      const updateIncidentDto = { createdByUserId: 2 };
      const newOwner = { ...mockUser, id: 2 };
      const updatedIncident = { ...mockIncident, created_by: newOwner };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockIncident);
      usersRepository.findOne.mockResolvedValue(newOwner);
      incidentsRepository.preload.mockResolvedValue(updatedIncident as any);
      incidentsRepository.save.mockResolvedValue(updatedIncident);
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedIncident);

      const result = await service.update(1, updateIncidentDto, mockAdminUser);

      expect(result).toEqual(updatedIncident);
    });

    it('should throw ForbiddenException when non-admin tries to change ownership', async () => {
      const updateIncidentDto = { createdByUserId: 2 };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockIncident);

      await expect(service.update(1, updateIncidentDto, mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('remove', () => {
    it('should delete incident and return success message', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIncident);
      incidentsRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove(1, mockUser);

      expect(result).toEqual({
        message: 'Incident deleted successfully',
        incidentId: 1
      });
      expect(incidentsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when incident not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIncident);
      incidentsRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(999, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findWithFilters', () => {
    it('should return filtered incidents with pagination', async () => {
      const queryDto: QueryIncidentsDto = {
        severity: Severity.HIGH,
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockIncident]),
      };

      const mockCountQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      incidentsRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder as any)
        .mockReturnValueOnce(mockCountQueryBuilder as any);

      const result = await service.findWithFilters(queryDto, mockAdminUser);

      expect(result).toEqual({
        incidents: [mockIncident],
        total: 1,
      });
    });
  });
});