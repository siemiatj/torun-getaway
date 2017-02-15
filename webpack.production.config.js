const path = require('path');
const PATHS = {
  app: path.join(__dirname, 'app'),
  static: path.resolve(__dirname, 'static'),
  build: path.resolve(__dirname, "build"),
};

const config = {
  entry: {
    app: './app/common.js'
  },
  output: {
    path: PATHS.static,
    filename: 'bundle.js'
  },
  devtool: "source-map",
  noInfo: true,
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
    ]
  },
  resolve: {
    modulesDirectories: ['app', 'node_modules'],
    extensions: ['', '.js'],
  }
};

module.exports = config;
