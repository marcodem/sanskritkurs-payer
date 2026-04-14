# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Nur Package-Dateien kopieren für schnellen Cache
COPY package*.json ./
RUN npm install

# Den Rest kopieren und bauen
COPY . .
RUN npm run docs:build

# Stage 2: Serve
FROM nginx:alpine
# Hier kopieren wir das Ergebnis aus dem Builder-Schritt
COPY --from=builder /app/docs/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
