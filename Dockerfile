FROM node:lts-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM base as dev
EXPOSE 3000
CMD ["node", "index.js"]

FROM base as prod
EXPOSE 3000