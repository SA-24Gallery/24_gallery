// src/lib/tidb.ts
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

let pool: Pool | null = null;

export function connect(): Pool {
    const options: PoolOptions = {
        host: process.env.TIDB_HOST, // TiDB host, for example: {gateway-region}.aws.tidbcloud.com
        port: Number(process.env.TIDB_PORT), // TiDB port, default: 4000
        user: process.env.TIDB_USER, // TiDB user, for example: {prefix}.root
        password: process.env.TIDB_PASSWORD, // The password of TiDB user.
        database: process.env.TIDB_DB_NAME, // TiDB database name, default: test
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
        },
        connectionLimit: 1, // Setting connectionLimit to "1" in a serverless function environment optimizes resource usage, reduces costs, ensures connection stability, and enables seamless scalability.
        maxIdle: 1, // max idle connections, the default value is the same as `connectionLimit`
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
        throw error; // Rethrow the error to handle it at the caller level
    }
}
