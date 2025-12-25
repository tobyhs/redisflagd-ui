require 'json'
require 'ruby-handlebars'
require 'ruby-handlebars/escapers/dummy_escaper'

module RedisFlagd
  # Object to render a log message when a resource is created, updated, or
  # deleted.
  class ResourceChangeLogFormatter
    def initialize
      hbs = Handlebars::Handlebars.new
      hbs.set_escaper(Handlebars::Escapers::DummyEscaper)
      hbs.register_helper('json_stringify') { |_, value| JSON.dump(value) }

      @created_template = hbs.compile(
        ENV['LOG_TEMPLATE_RESOURCE_CREATED'] ||
          '{{type}} created: {{json_stringify resource}}',
      )
      @updated_template = hbs.compile(
        ENV['LOG_TEMPLATE_RESOURCE_UPDATED'] ||
          '{{type}} updated; previous: {{json_stringify previous_resource}}, new: {{json_stringify new_resource}}',
      )
      @deleted_template = hbs.compile(
        ENV['LOG_TEMPLATE_RESOURCE_DELETED'] || '{{type}} deleted: {{key}}',
      )
    end

    # @param headers [Rack::Headers] request headers
    # @param type [String] type of resource
    # @param resource [#to_h] resource that was created
    # @return [String] log message for when a resource is created
    def resource_created(headers:, type:, resource:)
      @created_template.call({ headers:, type:, resource: resource.to_h })
    end

    # @param headers [Rack::Headers] request headers
    # @param type [String] type of resource
    # @param previous_resource [#to_h]
    #   previous version of resource
    # @param new_resource [#to_h]
    #   new version of resource
    # @return [String] log message for when a resource is updated
    def resource_updated(
      headers:,
      type:,
      previous_resource:,
      new_resource:
    )
      @updated_template.call({
        headers:,
        type:,
        previous_resource: previous_resource.to_h,
        new_resource: new_resource.to_h,
      })
    end

    # @param headers [Rack::Headers] request headers
    # @param type [String] type of resource
    # @param key [String] key of resource that was deleted
    # @return [String] log message for when a resource is deleted
    def resource_deleted(headers:, type:, key:)
      @deleted_template.call({ headers:, type:, key: })
    end
  end
end
