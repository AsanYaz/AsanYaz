import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

const DATABASE_POOL = 'DATABASE_POOL';

const databasePoolFactory = {
  provide: DATABASE_POOL,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  },
};

@Global()
@Module({
  providers: [databasePoolFactory],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}

export { DATABASE_POOL };
