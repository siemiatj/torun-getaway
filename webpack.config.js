const path              = require('path');
const webpack           = require('webpack');
const PATHS = {
  app: path.join(__dirname, 'app'),
  public: path.resolve(__dirname, 'public'),
  build: path.resolve(__dirname, "build"),
};

const config = {
  entry: {
    app: './app/common.js'
  },
  output: {
    path: PATHS.build,
    // publicPath: '/assets/',
    filename: 'bundle.js'
  },
  // devServer: {
  //   contentBase: './public',
  //   // historyApiFallback: true
  // },
  devtool: 'eval-source-map',
  noInfo: true,
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      // {
      //   test: /\.css$/,
      //   loader: 'style!css'
      // },
    ]
  },
  resolve: {
    modulesDirectories: ['app', 'node_modules'],
    extensions: ['', '.js'],
  }
};

module.exports = config;
