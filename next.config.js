const withCSS = require('@zeit/next-css');
const withPlugins = require('next-compose-plugins');

const withEnv = {
  // client env not secure
  publicRuntimeConfig: {
    SPACE_GRAPHQL_ENGINE_HOSTNAME: 'localhost:4122',
  },
  // server env secure same .env nodejs
  serverRuntimeConfig: {},
};

module.exports = withPlugins([
  withCSS({
    webpack: function (config, { isServer }) {
      config.module.rules.push({
        test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 100000,
            name: '[name].[ext]',
          },
        },
      });
      return config;
    },
  }),

  withEnv,
]);
