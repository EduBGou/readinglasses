FROM node:23-alpine

WORKDIR /backend

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "start"]