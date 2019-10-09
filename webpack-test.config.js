module.exports = {
  devtool: '(none)',
  mode: 'development',
  target: 'node',
  entry: {
    'builder2': './src/loader/resource-loader.mjs'
  },
  output: {
    libraryTarget: 'commonjs-module',
    path: `${__dirname}/dist/`
  },
  module: {
    rules: [
      {
        type: 'javascript/auto',
        test: /\.mjs$/,
        use: []
      }
    ]
  }
};
