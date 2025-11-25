require 'rack/headers'

require 'redis_flagd/feature_flag'
require 'redis_flagd/flag_change_log_formatter'

RSpec.describe RedisFlagd::FlagChangeLogFormatter do
  before do
    %w[
      LOG_TEMPLATE_FLAG_CREATED
      LOG_TEMPLATE_FLAG_UPDATED
      LOG_TEMPLATE_FLAG_DELETED
    ].each do |key|
      ENV.delete(key)
    end
    allow(ENV).to receive(:[]).and_call_original
  end

  subject(:formatter) { described_class.new }

  let(:headers) { Rack::Headers['X-Auth-Request-Email', 'john@example.com'] }
  let(:flag) do
    RedisFlagd::FeatureFlag.new(
      key: 'test_flag',
      configuration: {
        'state' => 'ENABLED',
        'variants' => {'on' => true, 'off' => false},
        'defaultVariant' => 'on',
      }
    )
  end

  describe '#flag_created' do
    it 'returns a log message' do
      expect(formatter.flag_created(headers:, flag:)).to eq(
        'Flag created: {"key":"test_flag","configuration":{"state":"ENABLED","variants":{"on":true,"off":false},"defaultVariant":"on"}}'
      )
    end

    context 'when the LOG_TEMPLATE_FLAG_CREATED env var is set' do
      before do
        allow(ENV).to receive(:[]).with('LOG_TEMPLATE_FLAG_CREATED').and_return(
          '{{headers.X-Auth-Request-Email}} created {{flag.key}}'
        )
      end

      it 'returns a log message' do
        expect(formatter.flag_created(headers:, flag:)).to eq(
          'john@example.com created test_flag'
        )
      end
    end
  end

  describe '#flag_updated' do
    let(:previous_configuration) do
      {
        'state' => 'DISABLED',
        'variants' => {'on' => true, 'off' => false},
        'defaultVariant' => 'off',
      }
    end

    it 'returns a log message' do
      message = formatter.flag_updated(
        headers:,
        flag_key: flag.key,
        previous_configuration:,
        new_configuration: flag.configuration,
      )
      expect(message).to eq('Flag updated: test_flag: previous: {"state":"DISABLED","variants":{"on":true,"off":false},"defaultVariant":"off"}, new: {"state":"ENABLED","variants":{"on":true,"off":false},"defaultVariant":"on"}')
    end

    context 'when the LOG_TEMPLATE_FLAG_UPDATED env var is set' do
      before do
        allow(ENV).to receive(:[]).with('LOG_TEMPLATE_FLAG_UPDATED').and_return(
          '{{headers.X-Auth-Request-Email}} updated {{flag_key}}'
        )
      end

      it 'returns a log message' do
        message = formatter.flag_updated(
          headers:,
          flag_key: flag.key,
          previous_configuration:,
          new_configuration: flag.configuration,
        )
        expect(message).to eq('john@example.com updated test_flag')
      end
    end
  end

  describe '#flag_deleted' do
    it 'returns a log message' do
      expect(formatter.flag_deleted(headers:, flag_key: flag.key)).to eq(
        'Flag deleted: test_flag'
      )
    end

    context 'when the LOG_TEMPLATE_FLAG_DELETED env var is set' do
      before do
        allow(ENV).to receive(:[]).with('LOG_TEMPLATE_FLAG_DELETED').and_return(
          '{{headers.X-Auth-Request-Email}} deleted {{flag_key}}'
        )
      end

      it 'returns a log message' do
        expect(formatter.flag_deleted(headers:, flag_key: flag.key)).to eq(
          'john@example.com deleted test_flag'
        )
      end
    end
  end
end
