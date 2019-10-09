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

  if (buildMode === 'production') {
    obj.module = {
      rules: [
        {
          test: /\.m?js$/,
          use: [
            // todo temporary remove loaders
            // {
            //   loader: 'air-m2-builder2/src/webpack-strip-block.js',
            //   options: {
            //     start: '<@debug>',
            //     end: '</@debug>'
            //   }
            // },
            // {
            //   loader: 'babel-loader',
            //   options: {
            //     presets: [
            //       [
            //         '@babel/preset-env',
            //         {
            //           targets: {
            //             browsers: ['last 2 versions', 'ie >= 8']
            //           }
            //         }
            //       ]
            //     ]
            //   }
            // }
          ]
        }
      ]
    };
  }

  return obj;
};
