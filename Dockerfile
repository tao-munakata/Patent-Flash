FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src/ ./src/
COPY config/ ./config/

RUN npx playwright install chromium --with-deps

EXPOSE 3100

CMD ["npx", "tsx", "src/wrapper-api.ts"]
