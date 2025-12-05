$LOAD_PATH.unshift(File.join(__dir__, 'lib'))

require 'redis_flagd/api'

unless ENV['REDIS_URL']
  abort 'Error: The REDIS_URL environment variable needs to be set'
end

frontend_dist_dir = File.join(__dir__, 'frontend', 'dist')
if File.exist?(frontend_dist_dir)
  use Rack::Deflater, include: ['text/css', 'text/javascript']
  use(
    Rack::Static,
    urls: ['/assets'],
    root: frontend_dist_dir,
    cache_control: 'max-age=604800',
  )
  index_html = File.read(File.join(frontend_dist_dir, 'index.html'))
  index_response_tuple = [200, { 'content-type' => 'text/html' }, [index_html]]
else
  index_response_tuple = [404, { 'content-type' => 'text/plain' }, ['']]
end

RedisFlagd::Api.compile!
app = lambda do |env|
  if env[Rack::PATH_INFO].start_with?('/api/')
    RedisFlagd::Api.call(env)
  else
    index_response_tuple
  end
end
run app
