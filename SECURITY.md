# WorkRoom security notes

## Production requirements

- Use unique, randomly generated values of at least 32 characters for `JWT_SECRET` and `COOKIE_SECRET`.
- Use a managed PostgreSQL database with TLS and a least-privilege database account.
- Set `NODE_ENV=production` and configure `CLIENT_URL` with only the exact HTTPS frontend origins.
- Serve the frontend and API over HTTPS. Never publish `.env`, database dumps, logs, or the local Prisma database.
- Run `npm audit`, `npm test`, and `npm run build` before deployment.
- Keep the API behind request logging, monitoring, backups, and an upstream rate limit or WAF.

## Security controls in the application

- Passwords use Argon2 and authentication uses an HttpOnly cookie.
- Mutating cookie-authenticated API requests verify their Origin.
- Workspace, private-room, workflow, and comment access is checked server-side.
- CORS uses an explicit origin allowlist and production cookies require HTTPS.
- API responses use `Cache-Control: no-store`; Helmet supplies security headers.

## Reporting a vulnerability

Do not include passwords, tokens, personal data, or working exploits in a public issue. Contact the repository owner privately with the affected endpoint, impact, and safe reproduction steps.
