# Estágio 1: Build da aplicação
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração do Maven primeiro (para cache de dependências)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fonte
COPY src ./src

# Compilar a aplicação (pular testes para build mais rápido)
RUN mvn clean package -DskipTests -B

# Estágio 2: Imagem final otimizada
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

# Copiar o JAR do estágio de build
COPY --from=builder /app/target/*.jar app.jar

# Criar diretório para logs
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Comando para rodar a aplicação
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=docker", "app.jar"]