const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  config.devServer = config.devServer || {};
  config.devServer.headers = {
    ...config.devServer.headers,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  };
  // Serve MSW service worker from public/
  config.devServer.static = [
    ...(Array.isArray(config.devServer.static) ? config.devServer.static : config.devServer.static ? [config.devServer.static] : []),
    { directory: path.resolve(__dirname, 'public'), publicPath: '/' },
  ];
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": false,
  };
  return config;
};