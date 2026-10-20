# Shared leaderboard on your own PostgreSQL server

The Node application serves both the game and `/api/scores`. PostgreSQL is reached
only by the backend through `DATABASE_URL`; no Supabase service or account is used.
A static `dist/` upload alone no longer provides a working leaderboard.

## Database separation

Use an existing, deliberately shared PostgreSQL instance, with a **dedicated
`scarab` database and login role**. Do not put game tables into Coolify's or
AppFlowy's own database, and do not use their application credentials. Their
current containers are managed as part of those applications; sharing such an
instance also couples availability, upgrades and deletion to that stack. A
persistent general-purpose PostgreSQL resource in Coolify is the cleaner host
for multiple applications.

As the PostgreSQL administrator, create a non-superuser login and database:

```sql
CREATE ROLE scarab LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE scarab OWNER scarab;
REVOKE ALL ON DATABASE scarab FROM PUBLIC;
GRANT CONNECT ON DATABASE scarab TO scarab;
```

Set the role's password securely, for example with `\password scarab` in psql.
Do not commit the password or use the PostgreSQL administrator role for the app.
Keep the database port private on a Docker network shared with the game service.
Other databases on the shared instance must also restrict access appropriately;
creating a role alone does not override existing PUBLIC grants elsewhere.

## Environment and schema

Configure these secrets/settings in Coolify (or in the process environment):

- `DATABASE_URL=postgresql://scarab:<URL-encoded-password>@<internal-host>:5432/scarab`
- `PUBLIC_ORIGIN=https://<game-domain>` — exact public origin, without a path.
- `HOST=0.0.0.0` inside the container; defaults to loopback locally.
- `PORT=4173` (default).

For a connection outside a trusted private network, configure verified TLS through
node-postgres; do not disable certificate validation. `.env.example` is only a
reference: npm scripts do not automatically load `.env` files.

From the repository root, using Node.js 22 or newer:

```sh
npm ci
npm run migrate
npm start
```

Run `npm run migrate` once against the dedicated database before first startup.
It can be rerun safely and creates only the `leaderboard` schema, scores table
and ranking index. It does not create databases or roles. Use one migration job,
not concurrent jobs. For stricter privileges, run the migration with a separate
owner and grant the runtime role only schema USAGE and table SELECT/INSERT.

The server uses a pool capped at five connections. It stores the top-score data
and a server timestamp, while the API returns the ten highest scores (oldest
first on equal points). UUID submission keys make retries idempotent.

## Coolify / Docker on the Hetzner ARM64 host

Create a Dockerfile application from the GitHub repository:

- Build context / base directory: `/` (repository root)
- Dockerfile: `Dockerfile`
- Container port: `4173`
- Health check: `/healthz` (also checks database access)
- Connect to the shared PostgreSQL Docker network; use its internal hostname.
- Configure the game's domain in Coolify/Traefik and match `PUBLIC_ORIGIN`.
- Run the schema migration as a one-off command from the built image with the
  same database environment, before routing traffic to the application.

The official `node:22-bookworm-slim` base is selected for this Dockerfile. The
container build itself has not been tested on your server. No database volume
is needed on the game container; PostgreSQL's volume must persist independently
of game deployments. Include the `scarab` database in external backups using
`pg_dump` and test restoration into a separate database.

## Local development and tests

```sh
npm ci
npm run dev
npm test
```

Development serves `/__scenario` and other QA routes. Production (`npm start`)
returns 404 for those routes. Use a separate development database. Without
`DATABASE_URL`, development still runs the game and explicitly reports the
leaderboard as unavailable; it does not silently fall back to local scores.

Database tests execute the actual schema and queries in PGlite (embedded
PostgreSQL), including reopening a persisted database. HTTP tests start a local
server. PGlite is a development dependency, not used in production. Production
connection/TLS/role permissions require verification against the deployed server.

## Behaviour and limits

Scores are submitted explicitly with “Record Score” after victory, death or
quitting. The name is public. Existing browser-local scores are not automatically
uploaded. Network failures leave the submission retryable with the same key.

The backend validates fields, limits payloads to 2 KiB, uses parameterized SQL,
and allows 60 POST attempts per minute per process. This is an anonymous casual
leaderboard: the browser calculates the score, so knowledgeable players can
forge submissions. No server-side gameplay replay or anti-cheat guarantee is
implemented. The burst limiter is local to each app process and resets on restart.

## Production deployment

Production URL: https://scarab-of-ra.flurin-mueller.com

Coolify builds the `scarab-of-ra` application from this repository's `main`
branch using the root Dockerfile. A signed GitHub push webhook triggers automatic
production deployments. Other branches do not update production.

The separate Coolify resource `scarab-postgres` holds a persistent `scarab`
database and a non-superuser `scarab` login. Its port is private. `DATABASE_URL`
and `PUBLIC_ORIGIN` are configured in Coolify, outside this repository.
The initial schema is installed; future schema changes require running
`npm run migrate` before deploying code that requires those changes.

The Coolify health check uses Node.js to fetch `/healthz`, because the slim image
has neither curl nor wget. This endpoint also checks database access.
Only the exact POST path `/webhooks/source/github/events/manual` is routed to
Coolify through the game's HTTPS domain. Administration stays behind the SSH
tunnel, and webhook signatures are verified by Coolify.

External database backups and a restore test remain to be configured.
