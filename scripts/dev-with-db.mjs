import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function start() {
    console.log('Starting MongoDB Memory Server...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    console.log(`✅ In-memory MongoDB URI: ${uri}`);
    console.log('Starting Next.js Dev Server...');

    // Set the URI for the current process so seed scripts can use it
    process.env.MONGODB_URI = uri;

    // Run the seed script before starting Next.js
    console.log('Creating default Admin account...');
    const seedProcess = spawn('node', ['scripts/seed-admin.mjs'], {
        stdio: 'inherit',
        env: process.env,
        shell: true,
    });

    seedProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Failed to seed admin account.');
        }

        const nextProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            env: process.env,
            shell: true,
        });

        nextProcess.on('close', async (nextCode) => {
            console.log(`Next.js process exited with code ${nextCode}`);
            await mongod.stop();
            process.exit(nextCode ?? 0);
        });

        process.on('SIGINT', async () => {
            console.log('Shutting down...');
            nextProcess.kill('SIGINT');
            await mongod.stop();
            process.exit(0);
        });
    });
}

start().catch(console.error);
