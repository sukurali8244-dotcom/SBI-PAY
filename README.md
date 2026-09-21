# SBI-PAY

## Render deployment

This repository is a static HTML application served by the root-level Node server.

- Root Directory: leave blank
- Build Command: `npm install`
- Start Command: `npm start`

Render provides the `PORT` environment variable, which the server uses automatically.

## MongoDB configuration

The Render service must be deployed as a **Web Service**, not a Static Site. The included `render.yaml` configures the Node start command and `/api/health` check. Set `MONGODB_URI` in Render's environment settings, then redeploy.

Set these environment variables in Render or in a local `.env` file:

```text
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?appName=Cluster0
MONGODB_DB=sbipay
PORT=10000
```

The registration endpoint stores users in the `users` collection and hashes passwords before saving them. Never commit the real connection string; `.env` is ignored by Git.
