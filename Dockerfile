FROM node:lts-alpine as base
WORKDIR /app
# Install nodemon for hot reload
RUN npm install -g nodemon
COPY package*.json ./
RUN npm ci
COPY . .

FROM base as dev
EXPOSE 3000
CMD ["nodemon", "index.js"]

FROM base as prod
EXPOSE 3000