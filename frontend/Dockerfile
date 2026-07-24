# Imagen del frontend de AutoCare (React + Vite)
# En la Parte 1 se ejecuta el servidor de desarrollo de Vite.
# El build de produccion con Nginx se agregara en la parte de despliegue.
FROM node:22-alpine

WORKDIR /app

# Verificacion TLS de npm. Se deja activada por defecto.
# Solo debe ponerse en false en equipos donde un antivirus o proxy corporativo
# intercepta las conexiones HTTPS (ver README).
ARG NPM_STRICT_SSL=true

COPY package*.json ./
RUN npm ci --strict-ssl=${NPM_STRICT_SSL}

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
