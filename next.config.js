/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        'recharts': 'recharts/es6' // Use ES6 module to avoid eval
      }
      
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