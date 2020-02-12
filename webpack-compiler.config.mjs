export default ({ entry, path, filename, buildMode, resolve = null }) => {
  const obj = {
    mode: buildMode,
    entry,
    externals: { m2: '__M2' },
    output: {
      path,
      filename,
      library: '__m2unit__',
      libraryTarget: 'this'
    }
  };

  obj.module = {
    rules: [
      {
        test: /\.jsx$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react']
            }
          }
        ]
      }
    ]
  };

  if (buildMode === 'production' && process.env.DEV_MODE  !== '1') {
    obj.module.rules.push({
      test: /\.m?js$/,
      use: [
        {
          loader: 'air-m2-builder2/src/webpack-strip-block.js',
          options: {
            blocks: [
              ['<@debug>', '</@debug>'],
              ['debug:start', 'debug:end'],
            ]
          }
        },
        {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'ie >= 8']
                  }
                }
              ]
            ]
          }
        }
      ]
    });
  }

  return obj;
};
