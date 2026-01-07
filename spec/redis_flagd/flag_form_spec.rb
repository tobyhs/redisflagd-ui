require 'redis_flagd/flag_form'
require 'redis_flagd/flags_repository'

RSpec.describe RedisFlagd::FlagForm do
  subject(:form) { described_class.new(attributes) }

  describe '#save' do
    let(:flags_repository) { instance_double(RedisFlagd::FlagsRepository) }
    let(:valid_attributes) do
      {
        key: 'test',
        state: 'ENABLED',
        variants: { 'red' => 'r', 'green' => 'g', 'blue' => 'b' },
      }
    end

    before do
      allow(RedisFlagd::ServiceLocator).to receive(:flags_repository)
        .and_return(flags_repository)
    end

    context 'when attributes are valid' do
      let(:attributes) { valid_attributes }

      shared_examples_for 'a successful save' do
        it 'saves the flag and returns true' do
          expected_flag = RedisFlagd::FeatureFlag.new(
            key: attributes[:key],
            configuration: attributes.except(:key),
          )
          expect(flags_repository).to receive(:upsert).with(expected_flag)
          expect(form.save).to be(true)
          expect(form.flag).to eq(expected_flag)
        end
      end

      it_behaves_like 'a successful save'

      context 'with optional attributes provided' do
        let(:attributes) do
          valid_attributes.merge({
            defaultVariant: 'green',
            targeting: {
              'if' => [
                { 'ends_with' => [{ 'var' => 'email' }, '@example.com'] },
                'blue',
              ],
            },
            metadata: { 'team' => 'infrastructure' },
          })
        end

        it_behaves_like 'a successful save'
      end
    end

    context 'when attributes are not valid' do
      shared_examples_for 'a failed save' do
        it 'does not save the flag and returns false' do
          expect(flags_repository).not_to receive(:upsert)
          expect(form.save).to be(false)
          expect(form.flag).to be_nil
        end
      end

      context 'when key is absent' do
        let(:attributes) { valid_attributes.except(:key) }

        it_behaves_like 'a failed save'

        it 'adds an error' do
          form.save
          expect(form.errors.where(:key, :blank).length).to eq(1)
        end
      end

      context 'when state is invalid' do
        let(:attributes) { valid_attributes.merge({ state: 'OTHER' }) }

        it_behaves_like 'a failed save'

        it 'adds an error' do
          form.save
          expect(form.errors[:state]).to eq(['must be "ENABLED" or "DISABLED"'])
        end
      end

      context 'when variants is not a Hash' do
        let(:attributes) { valid_attributes.merge({ variants: true }) }

        it_behaves_like 'a failed save'

        it 'adds an error' do
          form.save
          expect(form.errors[:variants]).to eq(['must be a JSON object'])
        end
      end

      context 'when variants has values of different types' do
        let(:attributes) do
          valid_attributes.merge({ variants: { 'b' => true, 'n' => 0 } })
        end

        it_behaves_like 'a failed save'

        it 'adds an error' do
          form.save
          expect(form.errors[:variants]).to eq([
            'must have values of the same type',
          ])
        end
      end

      context 'when defaultVariant is not one of the variants' do
        let(:attributes) { valid_attributes.merge({ defaultVariant: 'other' }) }

        it_behaves_like 'a failed save'

        it 'adds an error' do
          form.save
          expect(form.errors[:defaultVariant]).to eq([
            'must be one of the variants',
          ])
        end
      end

      context 'when targeting is invalid' do
        let(:attributes) do
          valid_attributes.merge({ targeting: { 'foo' => 'bar' } })
        end

        it_behaves_like 'a failed save'

        it 'adds an error' do
          form.save
          expect(form.errors[:targeting]).to eq([
            'object property at `/foo` is a disallowed additional property',
          ])
        end
      end

      context 'when metadata is invalid' do
        let(:attributes) do
          valid_attributes.merge({ metadata: { 'label' => {} } })
        end

        it_behaves_like 'a failed save'

        it 'adds an error' do
          form.save
          expect(form.errors[:metadata]).to eq([
            'value at `/label` is not one of the types: ["string", "number", "boolean"]',
          ])
        end
      end
    end
  end
end
