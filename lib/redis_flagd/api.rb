require 'grape'

require 'redis_flagd/flag_form'
require 'redis_flagd/service_locator'

module RedisFlagd
  # HTTP API to manage RedisFlagd feature flags
  class Api < Grape::API
    format :json
    prefix :api

    helpers do
      # @return [Logger]
      def logger
        Api.logger
      end
    end

    FORM_CONTENT_TYPES = %w[
      application/x-www-form-urlencoded
      multipart/form-data
      text/plain
    ].freeze

    before do
      # Block CSRF via rejecting "simple" requests
      # https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#disallowing-simple-requests
      if FORM_CONTENT_TYPES.include?(env['CONTENT_TYPE'].to_s.downcase)
        error!('Content-Type not supported', 400)
      end
    end

    resource :flags do
      desc 'Lists feature flags'
      params do
        optional(
          :pattern,
          type: String,
          desc: 'glob pattern to match against feature flag keys',
        )
      end
      get do
        ServiceLocator.flags_repository.list(pattern: params[:pattern])
          .map(&:to_h)
      end

      desc 'Gets a feature flag'
      params do
        requires :key, type: String, desc: 'key of feature flag to get'
      end
      get ':key' do
        flag = ServiceLocator.flags_repository.get(params[:key])
        if flag
          flag.to_h
        else
          error!('Not Found', 404)
        end
      end

      desc 'Upserts a feature flag'
      params do
        requires :key, type: String, desc: 'key of feature flag'
        requires :state, type: String, values: %w[ENABLED DISABLED]
        requires :variants, type: Hash
        requires :defaultVariant, type: String
        optional :targeting, type: Hash
        optional :metadata, type: Hash
      end
      put do
        previous_flag = ServiceLocator.flags_repository.get(params[:key])
        flag_form = FlagForm.new(declared(params, include_missing: false))

        if flag_form.save
          flag = flag_form.flag
          if previous_flag
            logger.info(ServiceLocator.resource_change_log_formatter.resource_updated(
              headers:,
              type: 'Flag',
              previous_resource: previous_flag,
              new_resource: flag,
            ))
          else
            logger.info(ServiceLocator.resource_change_log_formatter.resource_created(
              headers:, type: 'Flag', resource: flag,
            ))
          end
          flag.to_h
        else
          errors = flag_form.errors.as_json.transform_values do |messages|
            messages.map { |message| { 'message' => message } }
          end
          error!({ 'errors' => errors }, 422)
        end
      end

      desc 'Deletes a feature flag'
      params do
        requires :key, type: String, desc: 'key of feature flag to delete'
      end
      delete ':key' do
        if ServiceLocator.flags_repository.delete(params[:key])
          logger.info(ServiceLocator.resource_change_log_formatter.resource_deleted(
            headers:, type: 'Flag', key: params[:key],
          ))
          nil
        else
          error!('Not Found', 404)
        end
      end
    end
  end
end
