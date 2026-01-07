FROM node:24.11.0-alpine3.22 AS frontend-build

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/index.html frontend/tsconfig*.json frontend/vite.config.ts ./
COPY frontend/src src
RUN npm run build


FROM ruby:3.4.8-alpine3.23

RUN bundle config --global frozen 1
EXPOSE 9292
ENV APP_ENV production

WORKDIR /app
RUN bundle config without development:test
COPY Gemfile Gemfile.lock ./
RUN BUILD_DEPS='build-base yaml-dev' && \
  apk add --no-cache $BUILD_DEPS && \
  bundle install && \
  apk del -r $BUILD_DEPS

COPY config.ru ./
COPY lib lib
COPY --from=frontend-build /app/dist frontend/dist
CMD ["bundle", "exec", "puma"]
