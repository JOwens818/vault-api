# Vault API

Vault API is a TypeScript/Express service for managing user-owned secrets. It issues JSON Web Tokens (JWT) to authenticated users, encrypts all secret payloads with AES-256-GCM before persistence, and exposes REST endpoints for CRUD, bulk import, and export (CSV/XLSX) operations. MongoDB provides storage for users and secrets, while a status endpoint reports application and database health.

## Features
- User registration, login, and profile retrieval secured by ES256 JWTs.
- Secrets are encrypted at rest and decrypted on read; import/export supported via CSV or Excel uploads.
- Graceful MongoDB connection handling with automatic retry and connection status reporting.
- Hardened Express stack with Helmet, CORS allowlist, compression, Mongoose models, and structured error middleware.

## Environment Variables
Create a `.env` file (copy `.env.example`) and provide the following values:

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment (`development`, `test`, or `production`). |
| `PORT` | Port the HTTP server listens on (e.g. `3030`). |
| `MONGODB_USERNAME`, `MONGODB_PASSWORD` | MongoDB credentials used for connecting. |
| `MONGODB_DATABASE`, `MONGODB_HOST`, `MONGODB_PORT` | MongoDB database name and host settings. |
| `JWT_PRIVATE`, `JWT_PUBLIC` | ES256 key pair (PEM contents with `\n` line breaks) used to sign and verify tokens. |
| `ENCRYPTION_KEY` | Passphrase used to derive the AES-256-GCM key for secret encryption (keep this private). |
| `CORS_ORIGINS` | Comma-separated list of allowed origins (leave empty to allow all in non-production scenarios). |

To generate an ES256 key pair for JWT signing:

```bash
openssl ecparam -name prime256v1 -genkey -noout -out jwt-private.pem
openssl ec -in jwt-private.pem -pubout -out jwt-public.pem
# Convert multi-line PEM files to single-line env values:
awk '{printf "%s\\n", $0}' jwt-private.pem
awk '{printf "%s\\n", $0}' jwt-public.pem
```

Set `ENCRYPTION_KEY` to a strong passphrase (at least 32 characters recommended); changing it after data is stored invalidates existing ciphertext.

## Local Development
1. **Install prerequisites**: Node.js 20+, npm, and a running MongoDB instance accessible with the credentials supplied in `.env`.
2. **Install dependencies**: `npm install`.
3. **Compile TypeScript**: `npm run build` (produces the `dist/` output used by the runtime).
4. **Run the service**: `npm start`. The API listens on `http://localhost:${PORT}`.
5. **Run tests (optional)**: `npm run test`.

Uploaded import files are stored under `uploads/`; adjust or clean up as needed during development.

## Docker Deployment
1. Ensure your `.env` file contains production-safe values. The Docker image reads configuration from this file at runtime.
2. Build the image:
   ```bash
   docker build -t vault-api .
   ```
3. Run the container (maps the internal port `3030` to the host and persists uploads):
   ```bash
   docker run -d --name vault-api \
     --env-file .env \
     -p 3030:3030 \
     -v $(pwd)/uploads:/app/uploads \
     vault-api
   ```

The Dockerfile runs tests during build and prunes dev dependencies before producing the final image. Update port mappings if `PORT` differs from `3030`.

## API Overview
- `POST /api/users/register` – Create a new user and receive a signed JWT.
- `POST /api/users/login` – Authenticate and receive a JWT.
- `GET /api/users/user-info` – Retrieve current user info (requires `Authorization: Bearer <token>`).
- `POST /api/secrets` – Create a new secret for the authenticated user.
- `GET /api/secrets/:id`, `PUT /api/secrets/:id`, `DELETE /api/secrets/:id` – Manage an individual secret.
- `GET /api/secrets` – List decrypted labels for all secrets owned by the user.
- `POST /api/secrets/import` – Upload CSV/XLSX files with `label`, `data`, `notes` columns.
- `GET /api/secrets/export?format=csv|xlsx` – Download all secrets.
- `GET /api/status` – Health/status report with app version and MongoDB connection state.

Use the JWT returned from registration/login in the `Authorization` header to access authenticated routes.
