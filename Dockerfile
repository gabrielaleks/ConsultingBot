FROM node:20.6.1 AS base
WORKDIR /consulting-chatbot
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./

FROM base AS development
RUN pnpm config set store-dir /root/.local/share/pnpm/store
CMD ["sh", "-c", "pnpm install && pnpm run dev"]