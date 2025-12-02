# RedisFlagd UI

RedisFlagd UI is a web app to manage [RedisFlagd](https://github.com/tobyhs/redisflagd) feature flags.

## Configuration

RedisFlagd UI can be configured with the following environment variables:

| Environment Variable | Description |
| --- | --- |
| `REDIS_URL` | URL of Redis server with your flag configurations, e.g. `redis://flagd-redis.production:6379` |
| `LOG_TEMPLATE_FLAG_CREATED` | Handlebars template for the message logged when a flag is created. Available variables are `headers` (request headers) and `flag` (the flag that was created) |
| `LOG_TEMPLATE_FLAG_UPDATED` | Handlebars template for the message logged when a flag is updated. Available variables are `headers` (request headers), `flag_key` (key of updated flag), `previous_configuration`, and `new_configuration` |
| `LOG_TEMPLATE_FLAG_DELETED` | Handlebars template for the message logged when a flag is deleted. Available variables are `headers` (request headers) and `flag_key` (key of deleted flag) |

Handlebars templates have a `json_stringify` helper to serialize JSON objects.

## Development

For the backend, ensure you have the right version of Ruby installed (see [.ruby-version](.ruby-version)). Run `bundle install` to install dependencies. Set the `REDIS_URL` environment variable to the URL of a Redis database. Run `bundle exec puma` to start the server.

For the frontend, ensure you have the right version of Node.js installed (see [.node-version](.node-version)). In the `frontend` directory, run `npm install` to install dependencies. Run `npm run dev` to start the dev server. Visit http://localhost:5173/.

## Tests

To run the backend tests, set the `TEST_REDIS_URL` environment variable and run `bundle exec rspec`.

To run the frontend tests, run `npm run test` in the `frontend` directory.
