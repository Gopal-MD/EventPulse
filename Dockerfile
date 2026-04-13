# ─── Stage 1: Build the React Frontend ───────────────────────────────────────
FROM node:18-alpine AS builder

# Accept Maps API key as a build argument (passed via Cloud Run / docker build --build-arg)
ARG VITE_MAPS_API_KEY
ENV VITE_MAPS_API_KEY=$VITE_MAPS_API_KEY

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Vite bakes VITE_* env vars into the bundle at build time
RUN npm run build

# ─── Stage 2: Production Node.js Server ───────────────────────────────────────
FROM node:18-alpine

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy compiled frontend assets so Express can serve them
COPY --from=builder /app/frontend/dist /app/frontend/dist

# Cloud Run injects PORT automatically (default 8080)
EXPOSE 8080

# Start the Express server
CMD ["node", "server.js"]
