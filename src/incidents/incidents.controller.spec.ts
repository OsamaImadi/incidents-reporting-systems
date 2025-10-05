import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { UserType } from '../utils/userTypes.enum';
import { Severity } from '../utils/severity.enum';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';

describe('IncidentsController', () => {
  let controller: IncidentsController;
  let incidentsService: jest.Mocked<IncidentsService>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    userType: UserType.USER,
  };

  const mockIncident = {
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

  const mockIncidents = [mockIncident];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        {
          provide: IncidentsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findWithFilters: jest.fn(),
            findByUser: jest.fn(),
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

    controller = module.get<IncidentsController>(IncidentsController);
    incidentsService = module.get(IncidentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new incident', async () => {
      const createIncidentDto = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: Severity.HIGH,
      };

      const req = { user: mockUser };
      incidentsService.create.mockResolvedValue(mockIncident);

      const result = await controller.create(createIncidentDto, req);

      expect(result).toEqual(mockIncident);
      expect(incidentsService.create).toHaveBeenCalledWith(createIncidentDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all incidents for user', async () => {
      const req = { user: mockUser };
      incidentsService.findAll.mockResolvedValue(mockIncidents);

      const result = await controller.findAll(req);

      expect(result).toEqual(mockIncidents);
      expect(incidentsService.findAll).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findWithFilters', () => {
    it('should return filtered incidents', async () => {
      const queryDto = {
        severity: Severity.HIGH,
        limit: 10,
        offset: 0,
      };

      const req = { user: mockUser };
      const filteredResult = {
        incidents: mockIncidents,
        total: 1,
      };

      incidentsService.findWithFilters.mockResolvedValue(filteredResult);

      const result = await controller.findWithFilters(queryDto, req);

      expect(result).toEqual(filteredResult);
      expect(incidentsService.findWithFilters).toHaveBeenCalledWith(queryDto, mockUser);
    });
  });

  describe('findByUser', () => {
    it('should return incidents for specific user', async () => {
      const req = { user: mockUser };
      incidentsService.findByUser.mockResolvedValue(mockIncidents);

      const result = await controller.findByUser('1', req);

      expect(result).toEqual(mockIncidents);
      expect(incidentsService.findByUser).toHaveBeenCalledWith(1, mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a specific incident', async () => {
      const req = { user: mockUser };
      incidentsService.findOne.mockResolvedValue(mockIncident);

      const result = await controller.findOne('1', req);

      expect(result).toEqual(mockIncident);
      expect(incidentsService.findOne).toHaveBeenCalledWith(1, mockUser);
    });
  });

  describe('update', () => {
    it('should update an incident', async () => {
      const updateIncidentDto = { description: 'Updated description' };
      const updatedIncident = { ...mockIncident, description: 'Updated description' };

      const req = { user: mockUser };
      incidentsService.update.mockResolvedValue(updatedIncident);

      const result = await controller.update('1', updateIncidentDto, req);

      expect(result).toEqual(updatedIncident);
      expect(incidentsService.update).toHaveBeenCalledWith(1, updateIncidentDto, mockUser);
    });
  });

  describe('remove', () => {
    it('should delete an incident', async () => {
      const deleteResponse = {
        message: 'Incident deleted successfully',
        incidentId: 1,
      };

      const req = { user: mockUser };
      incidentsService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove('1', req);

      expect(result).toEqual(deleteResponse);
      expect(incidentsService.remove).toHaveBeenCalledWith(1, mockUser);
    });
  });
});