#!/bin/bash
 # 1. Den neuesten Stand der Webseite generieren
npm run docs:build

# 2. Das Docker-Image erstellen
docker build -t sanskritkurs:latest .

# und auf mein GitHub image repo schieben

