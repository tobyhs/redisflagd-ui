require 'json'
require 'ruby-handlebars'
require 'ruby-handlebars/escapers/dummy_escaper'

module RedisFlagd
  # Object to render a log message when a feature flag is created, updated, or
  # deleted.
  class FlagChangeLogFormatter
    def initialize
      hbs = Handlebars::Handlebars.new
      hbs.set_escaper(Handlebars::Escapers::DummyEscaper)
      hbs.register_helper('json_stringify') { |_, value| JSON.dump(value) }

      @created_template = hbs.compile(
        ENV['LOG_TEMPLATE_FLAG_CREATED'] ||
          'Flag created: {{json_stringify flag}}'
      )
      @updated_template = hbs.compile(
        ENV['LOG_TEMPLATE_FLAG_UPDATED'] ||
          'Flag updated: {{flag_key}}: previous: {{json_stringify previous_configuration}}, new: {{json_stringify new_configuration}}'
      )
      @deleted_template = hbs.compile(
        ENV['LOG_TEMPLATE_FLAG_DELETED'] ||
          'Flag deleted: {{flag_key}}'
      )
    end

    # @param headers [Rack::Headers] request headers
    # @param flag [FeatureFlag] flag that was created
    # @return [String] log message for when a flag is created
    def flag_created(headers:, flag:)
      @created_template.call({headers:, flag: flag.to_h})
    end

    # @param headers [Rack::Headers] request headers
    # @param flag_key [String] key of feature flag that was updated
    # @param previous_configuration [Hash{String => Object}]
    # @param new_configuration [Hash{String => Object}]
    # @return [String] log message for when a flag is updated
    def flag_updated(
      headers:,
      flag_key:,
      previous_configuration:,
      new_configuration:
    )
      @updated_template.call({
        headers:,
        flag_key:,
        previous_configuration:,
        new_configuration:,
      })
    end

    # @param headers [Rack::Headers] request headers
    # @param flag_key [String] key of flag that was deleted
    # @return [String] log message for when a flag is deleted
    def flag_deleted(headers:, flag_key:)
      @deleted_template.call({headers:, flag_key:})
    end
  end
end
