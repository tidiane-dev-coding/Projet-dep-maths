import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import announcementsRoutes from './routes/announcements';
import usersRoutes from './routes/users';
import gradesRoutes from './routes/grades';
import messagesRoutes from './routes/messages';
import electionsRoutes from './routes/elections';
import scheduleRoutes from './routes/schedule';
import resourcesRoutes from './routes/resources';
import committeesRoutes from './routes/committees';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // Servir les fichiers uploadés (PDF) depuis /uploads
  const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  app.use('/api/auth', authRoutes);
  app.use('/api/announcements', announcementsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/grades', gradesRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/elections', electionsRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/resources', resourcesRoutes);
  app.use('/api/committees', committeesRoutes);

  app.get('/', (req, res) => res.json({ ok: true }));

  // Global error handler (returns stack in non-production for easier debugging)
  // Place after all routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    const status = err && err.status ? err.status : 500;
    const payload: any = { message: err && err.message ? err.message : 'Internal Server Error' };
    if (process.env.NODE_ENV !== 'production') payload.stack = err && err.stack ? err.stack : null;
    res.status(status).json(payload);
  });

  return app;
}
