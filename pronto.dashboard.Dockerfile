FROM node:latest

COPY dashboard /usr/src/app

WORKDIR /usr/src/app

RUN corepack enable pnpm

RUN pnpm install

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]
