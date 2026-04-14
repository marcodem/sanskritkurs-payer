# Build Terminal:
# 1. npm run docs:build
# 2. docker build -t sanskritkurs:v1.0 .

FROM nginx:alpine

# Kopiere die statischen Dateien aus dem VitePress Build
COPY docs/.vitepress/dist /usr/share/nginx/html

# Kopiere eine minimale Nginx-Konfiguration für korrekte Clean-URL Unterstützung
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
