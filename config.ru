$LOAD_PATH.unshift(File.join(__dir__, 'lib'))

require 'redis_flagd/api'

unless ENV['REDIS_URL']
  abort 'Error: The REDIS_URL environment variable needs to be set'
end

RedisFlagd::Api.compile!
run RedisFlagd::Api
