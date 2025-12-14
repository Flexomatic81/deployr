FROM node:20-alpine

WORKDIR /app

# Docker CLI installieren (für Container-Management)
RUN apk add --no-cache docker-cli

# Package files kopieren
COPY package*.json ./

# Dependencies installieren
RUN npm install --production

# App-Code kopieren
COPY . .

# Port freigeben
EXPOSE 3000

# App starten
CMD ["npm", "start"]
