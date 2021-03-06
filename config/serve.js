const webpack = require('webpack');
const path = require('path');
const PreactRefreshPlugin = require('@prefresh/webpack');
const HtmlPlugin = require('html-webpack-plugin');
// const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
// const WebExtWebpackPlugin = require('@ianwalter/web-ext-webpack-plugin');
const commonConfig = require('./common');

module.exports = function (configDirs) {
  // const smp = new SpeedMeasurePlugin({disable:false,
  //   // outputFormat:'humanVerbose',
  //   granularLoaderData:true });

  var devConfig = {
    ...commonConfig(configDirs),
    devtool: 'inline-source-map', // only these source maps work
    devServer: {
      writeToDisk: true,
      compress: false,
      hot: true,
      historyApiFallback: true,
      port: 3000,
      liveReload: false,
      watchOptions: {
        poll: true,
        ignored: /node_modules/,
      },
    },
  };
  devConfig.output.path = configDirs.SERVE_DIR;
  devConfig.entry = {
    ...devConfig.entry,
    dev: configDirs.APP_DIR + '/dev/dev.tsx',
  };
  devConfig.module.rules[0].use[0].options.plugins = [
    ...devConfig.module.rules[0].use[0].options.plugins,
    require.resolve('@prefresh/babel-plugin'),
  ];

  devConfig.plugins = [
    ...devConfig.plugins,
    new HtmlPlugin({
      filename: 'background.html',
      template: configDirs.HTML_DIR + '/background.html',
      chunks: ['background'],
    }),
    new HtmlPlugin({
      filename: 'content-script.html',
      template: configDirs.HTML_DIR + '/content-script.html',
      chunks: ['content-script'],
    }),
    new HtmlPlugin({
      filename: 'dev.html',
      template: configDirs.HTML_DIR + '/dev.html',
      chunks: ['dev'],
    }),
    new HtmlPlugin({
      filename: 'index.html',
      template: configDirs.HTML_DIR + '/dev.html',
      chunks: ['dev'],
    }),
    new PreactRefreshPlugin(),
  ];
  console.log('\x1b[36m%s\x1b[0m', 'Serving...');
  // return smp.wrap(devConfig);
  return devConfig;
};
