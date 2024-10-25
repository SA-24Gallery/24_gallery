import mysql, { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

let pool: Pool | null = null;

export function connect(): Pool {
  const options: PoolOptions = {
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DB_NAME,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    connectionLimit: 1,
    maxIdle: 1,
    enableKeepAlive: true,
  };

  return mysql.createPool(options);
}

export function getPool(): Pool {
  if (!pool) {
    pool = connect();
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function query<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(
  sql: string,
  params: any[] = []
): Promise<T> {
  const pool = getPool();
  const [results] = await pool.execute(sql, params);
  return results as T;
}