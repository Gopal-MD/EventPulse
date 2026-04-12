# Use Node.js as the base image
FROM node:18-alpine AS builder

# Build Frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Setup Backend
FROM node:18-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy built frontend so the express server can host it
COPY --from=builder /app/frontend/dist /app/frontend/dist

# Expose the Cloud Run port
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
