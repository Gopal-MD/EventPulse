# ---- Build Stage ----
FROM node:18-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json ./
RUN npm install --production

# Copy application files
COPY . .

# Cloud Run uses PORT env variable
EXPOSE 8080

CMD ["node", "server.js"]
