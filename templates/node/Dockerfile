FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

EXPOSE {{SERVICE_PORT}}

CMD ["node", "src/index.js"]
