
FROM oven/bun:1.3.8-alpine AS build-stage

WORKDIR /app

COPY package.json bun.lock /app/

COPY frontend/package.json /app/frontend/

WORKDIR /app/frontend

RUN bun install

COPY ./frontend /app/frontend
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

RUN bun run build

FROM nginx:1

COPY --from=build-stage /app/frontend/dist/ /usr/share/nginx/html

COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./frontend/backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf
