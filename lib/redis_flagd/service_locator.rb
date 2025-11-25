require 'redis'

require 'redis_flagd/flag_change_log_formatter'
require 'redis_flagd/flags_repository'

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

      # @return [FlagChangeLogFormatter]
      def flag_change_log_formatter
        @flag_change_log_formatter ||= FlagChangeLogFormatter.new
      end
    end
  end
end
