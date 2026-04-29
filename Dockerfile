# ============================================================
# AI-PM Platform — Multi-stage Docker Build
# ============================================================

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# 前端环境变量（Vite 构建时注入）
ARG VITE_JIRA_BASE_URL=https://jira.logisticsteam.com
ARG VITE_DEFAULT_BOARD_ID=1
ENV VITE_JIRA_BASE_URL=$VITE_JIRA_BASE_URL
ENV VITE_DEFAULT_BOARD_ID=$VITE_DEFAULT_BOARD_ID

RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Only copy what's needed for production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Create data directory for user storage
RUN mkdir -p data && echo '[]' > data/users.json

# Install production dependencies only
RUN npm ci --omit=dev

# Environment variables (override at runtime with -e or .env)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
