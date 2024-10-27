// server.ts
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import {closePool} from "@/lib/db";


const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    server.listen(port, () => {
        console.log(
            `> Server listening at http://${hostname}:${port} as ${
                dev ? 'development' : 'production'
            }`
        );
    });

    // Graceful shutdown handlers
    if (process.env.NODE_ENV === 'production') {
        const gracefulShutdown = async (signal: string) => {
            console.log(`${signal} received: closing database pool and HTTP server`);

            // First, stop accepting new requests
            server.close(async () => {
                try {
                    // Close database connections
                    await closePool();
                    console.log('Server and database connections closed successfully');
                    process.exit(0);
                } catch (error) {
                    console.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });

            // If server hasn't finished in 10s, force shutdown
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
}).catch((err) => {
    console.error('Error occurred starting server:', err);
    process.exit(1);
});