# Stage 1: Dev container
FROM node:20-alpine

# Install dependencies for node-gyp/bcrypt
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Install dependencies first (cache-friendly)

COPY package*.json tsconfig.json ./
RUN npm install

# Copy source code
COPY src ./src

# Install ts-node-dev globally for hot reload
RUN npm install -g ts-node-dev


# Default command (overridden in docker-compose for dev)
CMD ["npm", "run", "dev"]

