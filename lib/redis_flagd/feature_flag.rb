module RedisFlagd
  # A feature flag in RedisFlagd
  #
  # @!attribute [r] key
  #   @return [String] this feature flag's key/identifier
  # @!attribute [r] configuration
  #   @return [Hash{String => Object}] this feature flag's configuration
  class FeatureFlag < Data.define(:key, :configuration)
    # @return [Hash{String => Object}] this flag serialized as a Hash
    def to_h
      {'key' => key}.merge(configuration)
    end
  end
end
