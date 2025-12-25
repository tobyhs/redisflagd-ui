require 'redis'

require 'redis_flagd/flags_repository'
require 'redis_flagd/resource_change_log_formatter'

module RedisFlagd
  # Service locator to provide dependencies
  class ServiceLocator
    class << self
      # @return [Redis]
      def redis
        @redis ||= Redis.new(url: ENV.fetch('REDIS_URL'))
      end

      # @return [FlagsRepository]
      def flags_repository
        @flags_repository ||= FlagsRepository.new(redis)
      end

      # @return [ResourceChangeLogFormatter]
      def resource_change_log_formatter
        @resource_change_log_formatter ||= ResourceChangeLogFormatter.new
      end
    end
  end
end
