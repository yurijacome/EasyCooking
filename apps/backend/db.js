import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5, // Reduced for Supabase free tier
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  family: 4, // Forçar uso de IPv4 para evitar problemas de conexão IPv6
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

export default pool;

