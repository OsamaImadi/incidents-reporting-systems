import { Injectable } from '@nestjs/common';
import { AdminSeed } from './admin.seed';

@Injectable()
export class SeedService {
  constructor(private readonly adminSeed: AdminSeed) {}

  async runSeeds(): Promise<void> {
    console.log('Starting database seeding...');
    
    try {
      await this.adminSeed.seedAdmin();
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
      throw error;
    }
  }
}
