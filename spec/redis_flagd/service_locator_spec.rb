require 'redis_flagd/service_locator'

RSpec.describe RedisFlagd::ServiceLocator do
  def clear_instance_variables
    described_class.instance_variables.each do |iv|
      described_class.remove_instance_variable(iv)
    end
  end

  before do
    clear_instance_variables
  end

  after do
    clear_instance_variables
  end

  describe '.redis' do
    it 'returns a Redis client' do
      expect(described_class.redis).to be_a(Redis)
    end
  end

  describe '.flags_repository' do
    it 'returns a FlagsRepository' do
      expect(described_class.flags_repository).
        to be_a(RedisFlagd::FlagsRepository)
    end
  end
end
