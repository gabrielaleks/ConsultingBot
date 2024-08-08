ARG PNPM_VERSION=8.7.1
FROM node:20.6.1

COPY . ./consulting-chatbot
WORKDIR /consulting-chatbot

RUN npm install -g pnpm@${PNPM_VERSION}

RUN pnpm install

ENTRYPOINT pnpm run build && pnpm start