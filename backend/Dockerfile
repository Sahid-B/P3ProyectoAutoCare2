# Imagen del backend de AutoCare (Node.js + Express)
FROM node:22-alpine

WORKDIR /app

# Verificacion TLS de npm. Se deja activada por defecto.
# Solo debe ponerse en false en equipos donde un antivirus o proxy corporativo
# intercepta las conexiones HTTPS (ver README).
ARG NPM_STRICT_SSL=true

# Se copian primero los archivos de dependencias para aprovechar la cache
COPY package*.json ./
RUN npm ci --strict-ssl=${NPM_STRICT_SSL}

# Codigo de la aplicacion
COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
