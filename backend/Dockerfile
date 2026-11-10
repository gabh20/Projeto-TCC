FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# O Prisma exige uma URL valida, mas nao acessa o banco durante esta etapa.
RUN DATABASE_URL="mysql://prisma:prisma@localhost:3306/prisma" npm run prisma:generate

CMD ["sh", "-c", "npx prisma migrate deploy && exec npm start"]
