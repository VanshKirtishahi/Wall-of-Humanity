const config = {
  allowedOrigins: [
    'http://localhost:5173',
    'https://wall-of-humanity.vercel.app'
  ],
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000
};

module.exports = config; 