FROM node:24-alpine AS deps
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
WORKDIR /usr/src/app

COPY package*.json ./
COPY --from=deps /usr/src/app/node_modules ./node_modules

COPY run.js ./
COPY bots ./bots
COPY classes ./classes
COPY games ./games
COPY maps ./maps

CMD ["node", "run.js"]
