import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Optional: log pool status for debugging
// setInterval(() => {
//   console.log(
//     `[PG Pool] total=${pool.totalCount}, idle=${pool.idleCount}, used=${pool.totalCount - pool.idleCount}, waiting=${pool.waitingCount}`
//   );
// }, 1000);
