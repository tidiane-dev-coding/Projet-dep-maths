# Backend minimal pour Dept Math

Pré-requis:
- Node 18+
- MongoDB (local ou Atlas)

Variables d'environnement (voir `.env.example`):
- `MONGO_URI` - URI MongoDB
- `PORT` - port du serveur (5000 par défaut)
- `JWT_SECRET` - secret JWT

Installation:

```powershell
cd backend
npm install
cp .env.example .env
# ajuster .env si besoin
npm run dev
```

Le serveur expose des routes sur `/api/*` et Socket.IO pour la messagerie.
# Backend minimal pour Dept Math

Installation

1. Copier `.env.example` en `.env` et ajuster `MONGO_URI` et `JWT_SECRET`.
2. Installer :

```bash
cd backend
npm install
```

3. Lancer en dev :

```bash
npm run dev
```

Endpoints principaux :
- POST /api/auth/register
- POST /api/auth/login
- GET/POST/PUT/DELETE /api/announcements
- GET/POST/PUT/DELETE /api/users
- GET/POST /api/grades
- Socket.IO pour la messagerie (événement `message`)
