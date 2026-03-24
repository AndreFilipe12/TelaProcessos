FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto do código
COPY . .

# Expor a porta da aplicação
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]
