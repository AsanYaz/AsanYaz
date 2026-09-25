import { pool } from './index';
import { SCHEMA_SQL } from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function migrate() {
  console.log('🔄 Running AsanYaz database migrations...');
  
  try {
    await pool.query(SCHEMA_SQL);
    console.log('✅ Database schema created successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
