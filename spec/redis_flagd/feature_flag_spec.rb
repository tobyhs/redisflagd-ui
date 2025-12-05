require 'redis_flagd/feature_flag'

RSpec.describe RedisFlagd::FeatureFlag do
  subject(:flag) do
    RedisFlagd::FeatureFlag.new(
      key: 'test_flag',
      configuration: {
        'state' => 'ENABLED',
        'variants' => { 'foo' => 'foo', 'bar' => 'bar' },
        'defaultVariant' => 'foo',
        'targeting' => { 'fractional' => [['foo', 50], ['bar', 50]] },
        'metadata' => { 'team' => 'infra' },
      },
    )
  end

  describe '#to_h' do
    it 'returns the flag serialized as a Hash' do
      expect(flag.to_h).to eq({
        'key' => 'test_flag',
        'state' => 'ENABLED',
        'variants' => { 'foo' => 'foo', 'bar' => 'bar' },
        'defaultVariant' => 'foo',
        'targeting' => { 'fractional' => [['foo', 50], ['bar', 50]] },
        'metadata' => { 'team' => 'infra' },
      })
    end
  end
end
