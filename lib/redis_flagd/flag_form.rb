require 'active_model'
require 'json_schemer'
require 'pathname'

require 'redis_flagd/feature_flag'
require 'redis_flagd/service_locator'

module RedisFlagd
  # Form object for upserting a feature flag.
  class FlagForm
    include ActiveModel::API

    # @return [String] the flag's key/identifier
    attr_accessor :key

    # @return ['ENABLED', 'DISABLED'] whether the flag is functional
    attr_accessor :state

    # @return [Hash{String => Boolean, Numeric, String, Hash}]
    #   variants that are served
    attr_accessor :variants

    # @return [String, nil] default variant to serve
    attr_accessor :defaultVariant # rubocop:disable Naming/MethodName

    # @return [Hash, nil] targeting rules/logic
    attr_accessor :targeting

    # @return [Hash{String => String, Numeric, Boolean}, nil]
    #   metadata about the flag
    attr_accessor :metadata

    # @return [FeatureFlag, nil]
    #   the upserted flag, or nil if no flag was upserted
    attr_reader :flag

    validates :key, presence: true
    validates :state, inclusion: {
      in: %w[ENABLED DISABLED],
      message: 'must be "ENABLED" or "DISABLED"',
    }
    validates(
      :defaultVariant,
      inclusion: {
        in: ->(form) { form.variants.keys },
        message: 'must be one of the variants',
      },
      allow_nil: true,
      if: :variants,
    )
    validate :variants_is_valid, :targeting_is_valid, :metadata_is_valid

    # Upserts a feature flag if validations pass.
    #
    # @return [Boolean] whether the flag was upserted
    def save
      return false unless valid?

      flag = FeatureFlag.new(
        key:,
        configuration: {
          state:,
          variants:,
          defaultVariant:,
          targeting:,
          metadata:,
        }.compact,
      )
      ServiceLocator.flags_repository.upsert(flag)
      @flag = flag
      true
    end

    private

    def variants_is_valid
      unless variants.is_a?(Hash)
        errors.add(:variants, 'must be a JSON object')
        return
      end

      values = variants.values
      unless values.all? { |v| [true, false].include?(v) } ||
          values.all? { |v| v.is_a?(Numeric) } ||
          values.all? { |v| v.is_a?(String) } ||
          values.all? { |v| v.is_a?(Hash) }
        errors.add(:variants, 'must have values of the same type')
      end
    end

    def targeting_is_valid
      return unless targeting

      flags_schema
        .ref('#/definitions/baseFlag/properties/targeting')
        .validate(targeting)
        .map { |e| e['error'] }
        .uniq
        .each { |message| errors.add(:targeting, message) }
    end

    def metadata_is_valid
      return unless metadata

      flags_schema
        .ref('#/definitions/metadata')
        .validate(metadata)
        .map { |e| e['error'] }
        .uniq
        .each { |message| errors.add(:metadata, message) }
    end

    def flags_schema
      @flags_schema ||= begin
        path = File.join(
          __dir__, '..', '..', 'flagd-schemas', 'json', 'flags.json',
        )
        JSONSchemer.schema(Pathname.new(path))
      end
    end
  end
end
