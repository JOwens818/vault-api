# Stage 1: Build the TypeScript application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run test
RUN npm run build
RUN npm prune --production

# Stage 2: Create the final, smaller production image
FROM node:20-alpine AS production

# Create a non-root user and switch to it
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build --chown=appuser:appgroup /app/package.json /app/package-lock.json ./
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/dist ./dist

# Expose the port your application listens on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/src/index.js"]