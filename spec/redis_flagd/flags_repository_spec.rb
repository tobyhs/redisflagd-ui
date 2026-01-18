require 'json'
require 'redis'

require 'redis_flagd/feature_flag'
require 'redis_flagd/flags_repository'

RSpec.describe RedisFlagd::FlagsRepository do
  let(:redis) { Redis.new(url: ENV.fetch('TEST_REDIS_URL')) }
  let(:repo) { described_class.new(redis) }

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
      },
    )
  end

  let(:feature_flags) { [boolean_flag, string_flag] }

  shared_context 'when the flag exists' do
    before do
      redis.hset(
        described_class::FLAGS_KEY,
        boolean_flag.key,
        boolean_flag.configuration.to_json,
      )
    end
  end

  before do
    redis.del(described_class::FLAGS_KEY)
  end

  describe '#list' do
    before do
      feature_flags.each do |flag|
        redis.hset(
          described_class::FLAGS_KEY,
          flag.key,
          flag.configuration.to_json,
        )
      end
    end

    context 'when no parameters are given' do
      it 'returns feature flags' do
        expect(repo.list).to eq(feature_flags)
      end
    end

    context 'when a pattern is given' do
      it 'only returns feature flags with keys matching the pattern' do
        expect(repo.list(pattern: 'bool*')).to eq([boolean_flag])
      end
    end

    context 'when an after argument is given' do
      it 'returns feature flags with keys after' do
        (0..4).each do |i|
          redis.hset(
            described_class::FLAGS_KEY,
            "test-#{i}",
            boolean_flag.configuration.to_json,
          )
        end
        expect(repo.list(after: 'test-2').map(&:key)).to eq(%w[test-3 test-4])
      end
    end

    context 'when a limit is given' do
      it 'returns feature flags up to the limit' do
        expect(repo.list(limit: 1)).to eq(feature_flags.first(1))
      end
    end
  end

  describe '#get' do
    context 'when the flag does not exist' do
      it 'returns nil' do
        expect(repo.get('none')).to be_nil
      end
    end

    context 'when the flag exists' do
      include_context 'when the flag exists'

      it 'returns the flag' do
        expect(repo.get(boolean_flag.key)).to eq(boolean_flag)
      end
    end
  end

  describe '#upsert' do
    context 'when the flag does not exist' do
      it 'creates the flag' do
        repo.upsert(boolean_flag)
        json = redis.hget(described_class::FLAGS_KEY, boolean_flag.key)
        expect(JSON.parse(json)).to eq(boolean_flag.configuration)
      end
    end

    context 'when the flag exists' do
      include_context 'when the flag exists'

      it 'updates the flag' do
        updated_configuration = {
          'state' => 'ENABLED',
          'variants' => { 'on' => true, 'off' => false },
          'defaultVariant' => 'off',
        }
        updated_flag = RedisFlagd::FeatureFlag.new(
          key: boolean_flag.key,
          configuration: updated_configuration,
        )

        repo.upsert(updated_flag)
        json = redis.hget(described_class::FLAGS_KEY, boolean_flag.key)
        expect(JSON.parse(json)).to eq(updated_configuration)
      end
    end
  end

  describe '#delete' do
    context 'when the flag does not exist' do
      it 'returns false' do
        expect(repo.delete('none')).to be(false)
      end
    end

    context 'when the flag exists' do
      include_context 'when the flag exists'

      it 'deletes the flag and returns true' do
        expect(repo.delete(boolean_flag.key)).to be(true)
        expect(redis.hexists(described_class::FLAGS_KEY, boolean_flag.key))
          .to be(false)
      end
    end
  end
end
