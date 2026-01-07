require 'rack/test'

require 'redis_flagd/api'

RSpec.describe RedisFlagd::Api do
  include Rack::Test::Methods

  let(:app) { described_class }
  let(:json_response) { JSON.parse(last_response.body) }
  let(:expected_request_headers) do
    Rack::Headers[{ 'host' => Rack::Test::DEFAULT_HOST, 'cookie' => '' }]
  end

  let(:boolean_flag) do
    RedisFlagd::FeatureFlag.new(
      key: 'boolean_flag',
      configuration: {
        'state' => 'ENABLED',
        'variants' => { 'on' => true, 'off' => false },
        'defaultVariant' => 'on',
      },
    )
  end

  let(:string_flag) do
    RedisFlagd::FeatureFlag.new(
      key: 'string_flag',
      configuration: {
        'state' => 'ENABLED',
        'variants' => { 'foo' => 'foo', 'bar' => 'bar' },
        'defaultVariant' => 'foo',
        'metadata' => { 'team' => 'infra' },
      },
    )
  end

  let(:flags_repository) { instance_double(RedisFlagd::FlagsRepository) }
  let(:resource_change_log_formatter) do
    instance_double(RedisFlagd::ResourceChangeLogFormatter)
  end

  before do
    described_class.logger(Logger.new(nil))
    allow(RedisFlagd::ServiceLocator).to receive_messages(
      flags_repository:,
      resource_change_log_formatter:,
    )
  end

  it 'blocks CSRF attempts' do
    post(
      '/api/flags',
      {},
      { 'CONTENT_TYPE' => 'application/x-www-form-urlencoded' },
    )
    expect(last_response.status).to eq(400)
    expect(json_response).to eq({ 'error' => 'Content-Type not supported' })
  end

  describe 'GET /api/flags' do
    it 'returns feature flags' do
      flags = [boolean_flag, string_flag]
      allow(flags_repository).to receive(:list).with(pattern: nil)
        .and_return(flags)
      get '/api/flags'
      expect(last_response.status).to eq(200)
      expect(json_response).to eq(flags.map { |f| f.to_h.stringify_keys })
    end

    context 'when given a pattern' do
      it 'returns feature flags matching the pattern' do
        pattern = 'bool*'
        allow(flags_repository).to receive(:list).with(pattern:)
          .and_return([boolean_flag])
        get "/api/flags?pattern=#{pattern}"
        expect(last_response.status).to eq(200)
        expect(json_response).to eq([boolean_flag.to_h.stringify_keys])
      end
    end
  end

  describe 'GET /api/flags/:key' do
    context 'when the flag does not exist' do
      it 'returns a 404' do
        allow(flags_repository).to receive(:get).with(string_flag.key)
          .and_return(nil)
        get "/api/flags/#{string_flag.key}"
        expect(last_response.status).to eq(404)
        expect(json_response).to eq({ 'error' => 'Not Found' })
      end
    end

    context 'when the flag exists' do
      it 'returns the flag' do
        allow(flags_repository).to receive(:get).with(string_flag.key)
          .and_return(string_flag)
        get "/api/flags/#{string_flag.key}"
        expect(last_response.status).to eq(200)
        expect(json_response).to eq(string_flag.to_h.stringify_keys)
      end
    end
  end

  describe 'PUT /api/flags' do
    let(:save_result) { true }
    let(:flag_result) { string_flag }
    let(:flag_form) do
      instance_double(
        RedisFlagd::FlagForm,
        save: save_result,
        flag: flag_result,
      )
    end

    before do
      allow(RedisFlagd::FlagForm).to receive(:new)
        .with(string_flag.to_h)
        .and_return(flag_form)
    end

    shared_examples 'a flag upsert endpoint' do
      it 'upserts the flag' do
        expect(described_class.logger).to receive(:info)
          .with(expected_log_message)
        expect(flag_form).to receive(:save)
        put(
          '/api/flags',
          string_flag.to_h.to_json,
          { 'CONTENT_TYPE' => 'application/json' },
        )
        expect(last_response.status).to eq(200)
        expect(json_response).to eq(string_flag.to_h.stringify_keys)
      end
    end

    context 'when the flag does not exist' do
      let(:expected_log_message) { 'Flag created' }

      before do
        allow(flags_repository).to receive(:get).with(string_flag.key)
          .and_return(nil)
        allow(resource_change_log_formatter).to receive(:resource_created)
          .with(headers: expected_request_headers, type: 'Flag', resource: string_flag)
          .and_return(expected_log_message)
      end

      it_behaves_like 'a flag upsert endpoint'
    end

    context 'when the flag exists' do
      let(:expected_log_message) { 'Flag updated' }

      before do
        allow(flags_repository).to receive(:get).with(string_flag.key)
          .and_return(string_flag)
        allow(resource_change_log_formatter).to receive(:resource_updated).with(
          headers: expected_request_headers,
          type: 'Flag',
          previous_resource: string_flag,
          new_resource: string_flag,
        ).and_return(expected_log_message)
      end

      it_behaves_like 'a flag upsert endpoint'
    end

    context 'when there are validation errors' do
      let(:save_result) { false }
      let(:flag_result) { nil }
      let(:am_errors) do
        errors = ActiveModel::Errors.new(flag_form)
        errors.add(:state, 'is not valid')
        errors.add(:variants, 'is malformed')
        errors
      end

      before do
        allow(flags_repository).to receive(:get).with(string_flag.key)
          .and_return(nil)
        allow(flag_form).to receive(:errors).and_return(am_errors)
      end

      it 'responds with errors' do
        put(
          '/api/flags',
          string_flag.to_h.to_json,
          { 'CONTENT_TYPE' => 'application/json' },
        )
        expect(last_response.status).to eq(422)
        expect(json_response).to eq({
          'errors' => {
            'state' => [{ 'message' => 'is not valid' }],
            'variants' => [{ 'message' => 'is malformed' }],
          },
        })
      end
    end
  end

  describe 'DELETE /api/flags/:key' do
    let(:key) { 'flag-to-delete' }

    before do
      allow(resource_change_log_formatter).to receive(:resource_deleted)
        .with(headers: expected_request_headers, type: 'Flag', key:)
        .and_return('Flag deleted')
    end

    context 'when the flag does not exist' do
      it 'returns a 404' do
        expect(flags_repository).to receive(:delete).with(key)
          .and_return(false)
        delete "/api/flags/#{key}", {}, { 'CONTENT_TYPE' => '' }
        expect(last_response.status).to eq(404)
        expect(json_response).to eq({ 'error' => 'Not Found' })
      end
    end

    context 'when the flag exists' do
      it 'deletes the flag and returns a 204' do
        expect(flags_repository).to receive(:delete).with(key)
          .and_return(true)
        expect(described_class.logger).to receive(:info).with('Flag deleted')
        delete "/api/flags/#{key}", {}, { 'CONTENT_TYPE' => '' }
        expect(last_response.status).to eq(204)
      end
    end
  end
end
