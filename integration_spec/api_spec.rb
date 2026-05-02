require 'net/http'

RSpec.describe 'RedisFlagd UI API' do
  let(:base_url) { ENV['BASE_URL'] || 'http://localhost:9292' }

  it 'upserts a flag', :aggregate_failures do
    flag_key = "testing-#{Time.now.to_i}"
    flag_uri = URI("#{base_url}/api/flags/#{flag_key}")
    flag = {
      'key' => flag_key,
      'state' => 'ENABLED',
      'variants' => { 'on' => true, 'off' => false },
      'defaultVariant' => 'on',
      'targeting' => { 'fractional' => [['on', 70], ['off', 30]] },
      'metadata' => { 'test' => true },
    }

    response = Net::HTTP.put(
      flag_uri,
      flag.to_json,
      { 'Content-Type' => 'application/json' },
    )
    expect(response).to be_a(Net::HTTPOK)
    expect(JSON.parse(response.body)).to eq(flag)

    response = Net::HTTP.get_response(flag_uri)
    expect(response).to be_a(Net::HTTPOK)
    expect(JSON.parse(response.body)).to eq(flag)
  end
end
