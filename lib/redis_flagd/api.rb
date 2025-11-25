require 'grape'

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
        optional :pattern, type: String,
          desc: 'glob pattern to match against feature flag keys'
      end
      get do
        ServiceLocator.flags_repository.list(pattern: params[:pattern]).
          map(&:to_h)
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
        requires :configuration, type: Hash do
          requires :state, type: String, values: %w[ENABLED DISABLED]
          requires :variants, type: Hash
          requires :defaultVariant, type: String
          optional :targeting, type: Hash
        end
      end
      put do
        previous_flag = ServiceLocator.flags_repository.get(params[:key])
        flag = FeatureFlag.new(
          key: params[:key],
          configuration: params[:configuration]
        )
        ServiceLocator.flags_repository.upsert(flag)

        if previous_flag
          logger.info(ServiceLocator.flag_change_log_formatter.flag_updated(
            headers:,
            flag_key: params[:key],
            previous_configuration: previous_flag.configuration,
            new_configuration: flag.configuration,
          ))
        else
          logger.info(ServiceLocator.flag_change_log_formatter.flag_created(
            headers:, flag:,
          ))
        end
        flag.to_h
      end

      desc 'Deletes a feature flag'
      params do
        requires :key, type: String, desc: 'key of feature flag to delete'
      end
      delete ':key' do
        if ServiceLocator.flags_repository.delete(params[:key])
          logger.info(ServiceLocator.flag_change_log_formatter.flag_deleted(
            headers:, flag_key: params[:key],
          ))
          nil
        else
          error!('Not Found', 404)
        end
      end
    end
  end
end
