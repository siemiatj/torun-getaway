const path              = require('path');
const webpack           = require('webpack');
const PATHS = {
  app: path.join(__dirname, 'app'),
  public: path.resolve(__dirname, 'public'),
  // assets: path.join(__dirname, 'assets')
};

const config = {
  entry: {
    app: './app/common.js'
  },
  output: {
    path: PATHS.public,
    publicPath: '/',
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: './public',
    // historyApiFallback: true
  },
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
    // alias: {
    //   'react': path.join(__dirname, 'node_modules', 'react')
    // },
    modulesDirectories: ['app', 'node_modules'],
    extensions: ['', '.js'],
  }
  // plugins: [
  //   new webpack.ProvidePlugin({
  //     $: 'jquery',
  //     jQuery: 'jquery'
  //   })
  // ]
};

module.exports = config;
