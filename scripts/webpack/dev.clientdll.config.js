const path = require('path')
const webpack = require('webpack')
const getProjectRoot = require('./utils/getProjectRoot')

const PROJECT_ROOT = getProjectRoot()
const DLL_ROOT = path.join(PROJECT_ROOT, 'dev/dll')

module.exports = {
  mode: 'development',
  entry: {
    vendors: [
      '@babel/polyfill',
      '@emotion/core',
      '@emotion/styled',
      '@mattkrick/fast-rtc-swarm',
      // '@mattkrick/graphql-trebuchet-client',
      '@mattkrick/sanitize-svg',
      // '@mattkrick/trebuchet-client',
      '@sentry/browser',
      'draft-js',
      'email-addresses',
      'eventemitter3',
      'fbjs',
      'flatted',
      'graphiql',
      'hoist-non-react-statics',
      'immutable',
      'json2csv',
      'jwt-decode',
      'linkify-it',
      'mousetrap',
      'ms',
      'oy-vey',
      'prop-types',
      'react',
      'react-beautiful-dnd',
      'react-copy-to-clipboard',
      'react-day-picker',
      'react-dom',
      'react-dom-confetti',
      // 'react-relay',
      'react-router',
      'react-router-dom',
      'react-swipeable-views',
      'react-textarea-autosize',
      'react-transition-group',
      'react-virtualized',
      'resize-observer-polyfill',
      'relay-runtime',
      'shortid',
      'string-score',
      'tayden-clusterfck',
      'tlds',
      'tslib',
      'unicode-substring'
    ]
  },
  output: {
    filename: '[name].dll.js',
    path: DLL_ROOT,
    library: '[name]'
  },
  plugins: [
    new webpack.DllPlugin({name: '[name]', path: path.join(DLL_ROOT, '[name].json')}) // eslint-disable-line no-new
  ],
  module: {
    rules: [
      {test: /\.flow$/, loader: 'ignore-loader'},
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      }
    ]
  }
}
