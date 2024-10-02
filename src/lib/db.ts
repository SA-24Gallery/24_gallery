
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

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

export async function query_data(sql: string): Promise<any> {
    try {
        const [rows] = await getPool().query(sql);
        console.log(rows);
        return rows;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}
