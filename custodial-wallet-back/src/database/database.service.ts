import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      host: configService.get('DB_HOST'),
      port: Number(configService.get('DB_PORT')),
      user: configService.get('DB_USER'),
      password: configService.get('DB_PASS'),
      database: configService.get('DB_NAME'),
    });
  }

  async onModuleInit() {
    await this.pool.connect();
    console.log('✅ Database Connected');
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('❎ Database Disconnected');
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }
}
