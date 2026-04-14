FROM nginx:alpine

# Wir kopieren nur den bereits gebauten Kurs
# Pfad anpassen, falls dein Ordner anders heißt (z.B. ./docs/.vitepress/dist)
COPY ./docs/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
