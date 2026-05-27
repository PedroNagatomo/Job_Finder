# Estágio 1: Build da aplicação React
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache)
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para o build)
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:alpine

# Remover configuração padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Rodar Nginx em foreground
CMD ["nginx", "-g", "daemon off;"]