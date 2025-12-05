import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './src/app';
import { initSocket } from './src/socket';
import mongoose from 'mongoose';
import { startHttpsPing } from './src/utils/keepAlive';

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dept-math';

async function start() {
  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB');

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    // Start automatic HTTPS ping to keep server awake (default every 10 minutes)
    const interval = Number(process.env.KEEP_ALIVE_INTERVAL_MS) || 10 * 60 * 1000;
    try {
      const stop = startHttpsPing("https://projet-dep-maths.onrender.com", interval);
      // expose stop in case we want to stop pings (useful for testing)
      ;(global as any).__KEEP_ALIVE_STOP__ = stop
      console.log(`KEEP-ALIVE: started pinging  every ${interval}ms`)
    } catch (e: any) {
      console.warn('KEEP-ALIVE: failed to start ping:', e && e.message ? e.message : e)
    }
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});

