FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY mock-api/ ./mock-api/
COPY mock-api/server.cjs ./

EXPOSE 4000
CMD ["node", "server.cjs"]