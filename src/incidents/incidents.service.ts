import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { Incident } from './entities/incident.entity';
import { User } from 'src/users/entities/user.entity';
import { UserType } from 'src/utils/userTypes.enum';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createIncidentDto: CreateIncidentDto, currentUser: User): Promise<Incident> {
    try {
      // Users can only create incidents for themselves, admins can create for anyone
      const { createdByUserId, ...rest } = createIncidentDto;
      
      // If createdByUserId is not provided, use current user
      const targetUserId = createdByUserId || currentUser.id;
      
      if (currentUser.userType !== UserType.ADMIN && currentUser.id !== targetUserId) {
        throw new ForbiddenException('You can only create incidents for yourself');
      }

      const user = await this.usersRepository.findOne({ where: { id: targetUserId } });
      if (!user) {
        throw new NotFoundException(`User with id ${targetUserId} not found`);
      }
      const incident = this.incidentsRepository.create({ ...rest, created_by: user });
      const savedIncident = await this.incidentsRepository.save(incident);
      
      // Reload to get the decrypted description
      return await this.findOne(savedIncident.id, currentUser);
    } catch (error) {
      // Handle unique constraint violations or other database errors
      if (error.code === '23505') { // PostgreSQL unique violation error code
        throw new ConflictException('Incident with this information already exists');
      }
      throw error;
    }
  }

  async findAll(currentUser: User): Promise<Incident[]> {
    if (currentUser.userType === UserType.ADMIN) {
      // Admin can see all incidents
      return await this.incidentsRepository.find({ relations: { created_by: true } });
    } else {
      // Regular users can only see their own incidents
      return await this.incidentsRepository.find({ 
        where: { created_by: { id: currentUser.id } },
        relations: { created_by: true }
      });
    }
  }

  async findWithFilters(queryDto: QueryIncidentsDto, currentUser: User): Promise<{ incidents: Incident[]; total: number }> {
    const queryBuilder = this.incidentsRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.created_by', 'user');

    // Apply user-based filtering
    if (currentUser.userType !== UserType.ADMIN) {
      queryBuilder.andWhere('incident.created_by.id = :userId', { userId: currentUser.id });
    }

    // Apply filters
    this.applyFilters(queryBuilder, queryDto);

    // Apply sorting
    this.applySorting(queryBuilder, queryDto);

    // Apply pagination
    const limit = queryDto.limit || 20;
    const offset = queryDto.offset || 0;
    queryBuilder.take(limit).skip(offset);

    // Get total count for pagination
    const totalQueryBuilder = this.incidentsRepository
      .createQueryBuilder('incident')
      .leftJoin('incident.created_by', 'user');

    if (currentUser.userType !== UserType.ADMIN) {
      totalQueryBuilder.andWhere('incident.created_by.id = :userId', { userId: currentUser.id });
    }

    this.applyFilters(totalQueryBuilder, queryDto);
    const total = await totalQueryBuilder.getCount();

    const incidents = await queryBuilder.getMany();
    return { incidents, total };
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Incident>, queryDto: QueryIncidentsDto): void {
    // Filter by severity
    if (queryDto.severity) {
      queryBuilder.andWhere('incident.severity = :severity', { severity: queryDto.severity });
    }

    // Filter by date range
    if (queryDto.startDate) {
      queryBuilder.andWhere('incident.timestamp >= :startDate', { startDate: queryDto.startDate });
    }
    if (queryDto.endDate) {
      queryBuilder.andWhere('incident.timestamp <= :endDate', { endDate: queryDto.endDate });
    }

    // Filter by created by user (admin only)
    if (queryDto.createdByUserId) {
      queryBuilder.andWhere('incident.created_by.id = :createdByUserId', { 
        createdByUserId: queryDto.createdByUserId 
      });
    }

    // Search in URL, description, or HTTP response
    if (queryDto.search) {
      queryBuilder.andWhere(
        '(incident.url ILIKE :search OR incident.description ILIKE :search OR incident.httpResponse ILIKE :search)',
        { search: `%${queryDto.search}%` }
      );
    }
  }

  private applySorting(queryBuilder: SelectQueryBuilder<Incident>, queryDto: QueryIncidentsDto): void {
    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder = queryDto.sortOrder || 'DESC';

    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = ['createdAt', 'updatedAt', 'severity', 'timestamp'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder.orderBy(`incident.${validSortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
  }

  async findByUser(userId: number, currentUser: User): Promise<Incident[]> {
    // Check if the target user exists
    const targetUser = await this.usersRepository.findOne({ where: { id: userId } });
    if (!targetUser) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (currentUser.userType === UserType.ADMIN) {
      // Admin can see incidents of any user
      return await this.incidentsRepository.find({ 
        where: { created_by: { id: userId } },
        relations: { created_by: true }
      });
    } else {
      // Regular users can only see their own incidents
      if (currentUser.id !== userId) {
        throw new ForbiddenException('You can only view your own incidents');
      }
      
      return await this.incidentsRepository.find({ 
        where: { created_by: { id: userId } },
        relations: { created_by: true }
      });
    }
  }

  async findOne(id: number, currentUser: User): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({ where: { id }, relations: { created_by: true } });
    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }

    // Check if user can access this incident
    if (currentUser.userType !== UserType.ADMIN && incident.created_by.id !== currentUser.id) {
      throw new ForbiddenException('You can only view your own incidents');
    }

    return incident;
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto, currentUser: User): Promise<Incident> {
    try {
      // First check if user can access this incident
      const existingIncident = await this.findOne(id, currentUser);

      const { createdByUserId, ...rest } = updateIncidentDto as any;

      let created_by: User | undefined;
      if (createdByUserId !== undefined) {
        // Only admins can change the creator of an incident
        if (currentUser.userType !== UserType.ADMIN) {
          throw new ForbiddenException('Only admins can change incident ownership');
        }
        
        const user = await this.usersRepository.findOne({ where: { id: createdByUserId } });
        if (!user) {
          throw new NotFoundException(`User with id ${createdByUserId} not found`);
        }
        created_by = user;
      }

      const preloaded = await this.incidentsRepository.preload({ id, ...rest, ...(created_by ? { created_by } : {}) });
      if (!preloaded) {
        throw new NotFoundException(`Incident with id ${id} not found`);
      }
      const savedIncident = await this.incidentsRepository.save(preloaded);
      
      // Reload to get the decrypted description
      return await this.findOne(savedIncident.id, currentUser);
    } catch (error) {
      // Handle unique constraint violations or other database errors
      if (error.code === '23505') { // PostgreSQL unique violation error code
        throw new ConflictException('Incident with this information already exists');
      }
      throw error;
    }
  }

  async remove(id: number, currentUser: User): Promise<{ message: string; incidentId: number }> {
    // First check if user can access this incident
    await this.findOne(id, currentUser);

    const result = await this.incidentsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    return {
      message: 'Incident deleted successfully',
      incidentId: id
    };
  }
}
