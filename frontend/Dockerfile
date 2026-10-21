
FROM oven/bun:1.3.8-alpine AS build-stage

WORKDIR /app

COPY package.json bun.lock /app/

COPY frontend/package.json /app/frontend/

WORKDIR /app/frontend

RUN bun install --frozen-lockfile

COPY ./frontend /app/frontend
RUN bun run build

FROM nginx:1.28-alpine

COPY --from=build-stage /app/frontend/dist/ /usr/share/nginx/html

COPY ./frontend/nginx-main.conf /etc/nginx/nginx.conf
COPY ./frontend/nginx.conf /etc/nginx/app.conf.template
COPY ./frontend/start-nginx.sh /usr/local/bin/start-nginx.sh
USER 101:101
EXPOSE 8080
ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-nginx.sh"]
CMD ["nginx", "-g", "daemon off;"]
