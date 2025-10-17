# Stage 1: Dependency install layer
FROM node:20-bullseye AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build and test
FROM node:20-bullseye AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run test
RUN npm run build
RUN npm prune --production

# Stage 3: Final production image
FROM node:20-bookworm-slim AS production

# Create a non-root user and switch to it
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
WORKDIR /app
COPY --from=build --chown=appuser:appgroup /app/package.json /app/package-lock.json ./
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads
USER appuser
ENV NODE_ENV=production
EXPOSE 3030

# Command to run the application
CMD ["node", "dist/src/index.js"]