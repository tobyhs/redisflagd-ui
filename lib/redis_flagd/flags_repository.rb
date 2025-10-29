require 'json'

require 'redis_flagd/feature_flag'

module RedisFlagd
  # A repository to manage RedisFlagd feature flags
  class FlagsRepository
    FLAGS_KEY = 'flagd:flags'
    DEFAULT_LIMIT = 50

    # @param redis [Redis] Redis client
    def initialize(redis)
      @redis = redis
    end

    # Lists feature flags.
    #
    # @param pattern [String, nil]
    #   optional pattern to only return feature flags with matching keys
    # @param limit [Integer] limit of feature flags to return
    # @return [Array<FeatureFlag>] feature flags that match the given pattern
    def list(pattern: nil, limit: DEFAULT_LIMIT)
      hash = @redis.hgetall(FLAGS_KEY)
      if pattern
        hash.select! { |key| File.fnmatch?(pattern, key) }
      end
      hash.first(limit).map do |key, configuration_json|
        FeatureFlag.new(key:, configuration: JSON.parse(configuration_json))
      end
    end

    # Gets a feature flag.
    #
    # @param key [String] key of feature flag to get
    # @return [FeatureFlag, nil]
    #   feature flag with the given key or nil if no such flag exists
    def get(key)
      value = @redis.hget(FLAGS_KEY, key)
      value && FeatureFlag.new(key:, configuration: JSON.parse(value))
    end

    # Upserts a feature flag.
    #
    # @param feature_flag [FeatureFlag] feature flag to create/update
    # @return [void]
    def upsert(feature_flag)
      @redis.hset(
        FLAGS_KEY,
        feature_flag.key,
        feature_flag.configuration.to_json,
      )
    end

    # Deletes a feature flag.
    #
    # @param key [String] key of feature flag to delete
    # @return [Boolean]
    #   true if the flag was deleted or false if the flag did not exist
    def delete(key)
      @redis.hdel(FLAGS_KEY, key) == 1
    end
  end
end
