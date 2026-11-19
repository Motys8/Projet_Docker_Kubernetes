# 1ère partie : Installation des dépendances 
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./ 
RUN npm ci --omit=dev
COPY . .

# 2ème partie : Image finale, minimale
FROM node:22-alpine
ENV NODE_ENV=production 
WORKDIR /app
COPY --from=build --chown=1000:1000 /app /app
USER 1000:1000
EXPOSE 3000 
CMD ["node", "server.js"]