/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.optimization.minimizer = config.optimization.minimizer.map(
      plugin => {
        if (plugin.constructor.name === 'TerserPlugin') {
          plugin.options.terserOptions.keep_classnames = true
          plugin.options.terserOptions.keep_fnames = true
        }
        return plugin
      }
    )

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }
    
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src * data: blob:",
              "connect-src *",
              "font-src 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig