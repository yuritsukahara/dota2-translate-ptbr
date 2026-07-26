FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build
RUN cp -r drizzle dist/server/migrations

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/wrangler d1 migrations apply DB --local --config dist/server/wrangler.json --persist-to /data && exec ./node_modules/.bin/wrangler dev --config dist/server/wrangler.json --ip 0.0.0.0 --port 3000 --persist-to /data"]
