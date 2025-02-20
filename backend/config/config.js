const config = {
  allowedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://wall-of-humanity.vercel.app',
    'https://wall-of-humanity-xhoc.onrender.com',
    'https://wall-of-humanity-dzyv1465l-vanshkirtishahis-projects.vercel.app'
  ],
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000
};

module.exports = config; 