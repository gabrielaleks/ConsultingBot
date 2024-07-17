ARG PNPM_VERSION=8.7.1
FROM node:20.6.1

COPY . ./nextjs-chat-rag
WORKDIR /nextjs-chat-rag

RUN npm install -g pnpm@${PNPM_VERSION}

RUN apt-get update && apt-get install -y python3 python3-pip python3.11-venv
RUN python3 -m venv /opt/venv
WORKDIR /nextjs-chat-rag/src/app/api/ai/embed/audio
RUN /opt/venv/bin/pip install --no-cache-dir -r requirements.txt
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /nextjs-chat-rag

ENTRYPOINT pnpm install && pnpm run build && pnpm start