require 'rack/headers'

require 'redis_flagd/feature_flag'
require 'redis_flagd/resource_change_log_formatter'

RSpec.describe RedisFlagd::ResourceChangeLogFormatter do
  subject(:formatter) { described_class.new }

  let(:headers) { Rack::Headers['X-Auth-Request-Email', 'john@example.com'] }
  let(:flag) do
    RedisFlagd::FeatureFlag.new(
      key: 'test_flag',
      configuration: {
        'state' => 'ENABLED',
        'variants' => { 'on' => true, 'off' => false },
        'defaultVariant' => 'on',
      },
    )
  end

  before do
    %w[
      LOG_TEMPLATE_RESOURCE_CREATED
      LOG_TEMPLATE_RESOURCE_UPDATED
      LOG_TEMPLATE_RESOURCE_DELETED
    ].each do |key|
      ENV.delete(key)
    end
    allow(ENV).to receive(:[]).and_call_original
  end

  describe '#resource_created' do
    it 'returns a log message' do
      expect(
        formatter.resource_created(headers:, type: 'Flag', resource: flag),
      ).to eq(
        'Flag created: {"key":"test_flag","state":"ENABLED","variants":{"on":true,"off":false},"defaultVariant":"on"}',
      )
    end

    context 'when the LOG_TEMPLATE_RESOURCE_CREATED env var is set' do
      before do
        allow(ENV).to receive(:[]).with('LOG_TEMPLATE_RESOURCE_CREATED')
          .and_return('{{headers.X-Auth-Request-Email}} created {{resource.key}}')
      end

      it 'returns a log message' do
        expect(
          formatter.resource_created(headers:, type: 'Flag', resource: flag),
        ).to eq('john@example.com created test_flag')
      end
    end
  end

  describe '#resource_updated' do
    let(:previous_configuration) do
      {
        'state' => 'DISABLED',
        'variants' => { 'on' => true, 'off' => false },
        'defaultVariant' => 'off',
      }
    end
    let(:previous_flag) do
      RedisFlagd::FeatureFlag.new(
        key: flag.key,
        configuration: previous_configuration,
      )
    end

    it 'returns a log message' do
      message = formatter.resource_updated(
        headers:,
        type: 'Flag',
        previous_resource: previous_flag,
        new_resource: flag,
      )
      expect(message).to eq(
        <<~MESSAGE.chomp,
          Flag updated; previous: {"key":"test_flag","state":"DISABLED","variants":{"on":true,"off":false},"defaultVariant":"off"}, new: {"key":"test_flag","state":"ENABLED","variants":{"on":true,"off":false},"defaultVariant":"on"}
        MESSAGE
      )
    end

    context 'when the LOG_TEMPLATE_RESOURCE_UPDATED env var is set' do
      before do
        allow(ENV).to receive(:[]).with('LOG_TEMPLATE_RESOURCE_UPDATED')
          .and_return('{{headers.X-Auth-Request-Email}} updated {{new_resource.key}}')
      end

      it 'returns a log message' do
        message = formatter.resource_updated(
          headers:,
          type: 'Flag',
          previous_resource: previous_flag,
          new_resource: flag,
        )
        expect(message).to eq('john@example.com updated test_flag')
      end
    end
  end

  describe '#resource_deleted' do
    it 'returns a log message' do
      expect(formatter.resource_deleted(headers:, type: 'Flag', key: flag.key))
        .to eq('Flag deleted: test_flag')
    end

    context 'when the LOG_TEMPLATE_RESOURCE_DELETED env var is set' do
      before do
        allow(ENV).to receive(:[]).with('LOG_TEMPLATE_RESOURCE_DELETED')
          .and_return('{{headers.X-Auth-Request-Email}} deleted {{key}}')
      end

      it 'returns a log message' do
        expect(
          formatter.resource_deleted(headers:, type: 'Flag', key: flag.key),
        ).to eq('john@example.com deleted test_flag')
      end
    end
  end
end
