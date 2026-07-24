const { Pool } = require('pg');

// DATABASE_URL is what hosted Postgres providers (Neon, Supabase, Vercel
// Storage) give you; PG* vars are used for local Docker Postgres instead.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });

module.exports = pool;
