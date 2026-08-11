FROM node:23-alpine

WORKDIR /frontend

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--host", "lan", "--clear"]