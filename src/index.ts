import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { createApp } from './app';
import { initSocket } from './socket';
import mongoose from 'mongoose';

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
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
