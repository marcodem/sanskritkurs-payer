# Schritt 1: Den Kurs bauen (Node.js Umgebung)
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Hier wird der dist-Ordner frisch auf dem GitHub-Server erstellt
RUN npm run docs:build 

# Schritt 2: Den Kurs ausliefern (Nginx Umgebung)
FROM nginx:alpine
# Wir kopieren das Ergebnis aus der build-stage
COPY --from=build-stage /app/docs/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
