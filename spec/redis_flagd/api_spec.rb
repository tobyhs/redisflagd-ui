require 'rack/test'

require 'redis_flagd/api'

RSpec.describe RedisFlagd::Api do
  include Rack::Test::Methods

  let(:app) { described_class }
  let(:json_response) { JSON.parse(last_response.body) }

  let(:boolean_flag) do
    RedisFlagd::FeatureFlag.new(
      key: 'boolean_flag',
      configuration: {
        'state' => 'ENABLED',
        'variants' => {'on' => true, 'off' => false},
        'defaultVariant' => 'on',
      }
    )
  end

  let(:string_flag) do
    RedisFlagd::FeatureFlag.new(
      key: 'string_flag',
      configuration: {
        'state' => 'ENABLED',
        'variants' => {'foo' => 'foo', 'bar' => 'bar'},
        'defaultVariant' => 'foo',
      }
    )
  end

  let(:flags_repository) { instance_double(RedisFlagd::FlagsRepository) }

  before do
    allow(RedisFlagd::ServiceLocator).to receive(:flags_repository).
      and_return(flags_repository)
  end

  it 'blocks CSRF attempts' do
    post(
      '/api/flags',
      {},
      {'CONTENT_TYPE' => 'application/x-www-form-urlencoded'}
    )
    expect(last_response.status).to eq(400)
    expect(json_response).to eq({'error' => 'Content-Type not supported'})
  end

  describe 'GET /api/flags' do
    it 'returns feature flags' do
      flags = [boolean_flag, string_flag]
      allow(flags_repository).to receive(:list).with(pattern: nil).
        and_return(flags)
      get '/api/flags'
      expect(last_response.status).to eq(200)
      expect(json_response).to eq(flags.map { |f| f.to_h.stringify_keys })
    end

    context 'when given a pattern' do
      it 'returns feature flags matching the pattern' do
        pattern = 'bool*'
        allow(flags_repository).to receive(:list).with(pattern:).
          and_return([boolean_flag])
        get "/api/flags?pattern=#{pattern}"
        expect(last_response.status).to eq(200)
        expect(json_response).to eq([boolean_flag.to_h.stringify_keys])
      end
    end
  end

  describe 'GET /api/flags/:key' do
    context 'when the flag does not exist' do
      it 'returns a 404' do
        allow(flags_repository).to receive(:get).with(string_flag.key).
          and_return(nil)
        get "/api/flags/#{string_flag.key}"
        expect(last_response.status).to eq(404)
        expect(json_response).to eq({'error' => 'Not Found'})
      end
    end

    context 'when the flag exists' do
      it 'returns the flag' do
        allow(flags_repository).to receive(:get).with(string_flag.key).
          and_return(string_flag)
        get "/api/flags/#{string_flag.key}"
        expect(last_response.status).to eq(200)
        expect(json_response).to eq(string_flag.to_h.stringify_keys)
      end
    end
  end

  describe 'PUT /api/flags' do
    it 'upserts the flag' do
      expect(flags_repository).to receive(:upsert).with(string_flag)
      put(
        '/api/flags',
        string_flag.to_h.to_json,
        {'CONTENT_TYPE' => 'application/json'}
      )
      expect(last_response.status).to eq(200)
      expect(json_response).to eq(string_flag.to_h.stringify_keys)
    end
  end

  describe 'DELETE /api/flags/:key' do
    let(:key) { 'flag-to-delete' }

    before do
      expect(flags_repository).to receive(:delete).with(key).
        and_return(flag_exists)
    end

    context 'when the flag does not exist' do
      let(:flag_exists) { false }

      it 'returns a 404' do
        delete "/api/flags/#{key}", {}, {'CONTENT_TYPE' => ''}
        expect(last_response.status).to eq(404)
        expect(json_response).to eq({'error' => 'Not Found'})
      end
    end

    context 'when the flag exists' do
      let(:flag_exists) { true }

      it 'deletes the flag and returns a 204' do
        delete "/api/flags/#{key}", {}, {'CONTENT_TYPE' => ''}
        expect(last_response.status).to eq(204)
      end
    end
  end
end
