module RedisFlagd
  # A feature flag in RedisFlagd
  #
  # @!attribute [r] key
  #   @return [String] this feature flag's key/identifier
  # @!attribute [r] configuration
  #   @return [Hash{String => Object}] this feature flag's configuration
  class FeatureFlag < Data.define(:key, :configuration)
  end
end
