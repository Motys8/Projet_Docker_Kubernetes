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

# Suppression de npm, yarn et corepack (inutiles au runtime et sources des 10 CVE)
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn* \
           /usr/local/bin/yarn \
           /usr/local/bin/yarnpkg

COPY --from=build --chown=1000:1000 /app /app
USER 1000:1000
EXPOSE 3000 
CMD ["node", "server.js"]