const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (buildMode, devServer, dirname, { masterPath, entryUnit, revision = null }) => {
  const obj = {
    mode: buildMode,
    entry: [`${__dirname}/src/m2.js`, masterPath.join('')],
    externals: {
      m2: '__M2'
    },
    output: {
      path: `${devServer ? masterPath[0] : dirname}/dist`,
      filename: 'm2.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        entryUnit,
        inject: false,
        hash: true,
        template: masterPath.join('').replace(/\.js$/g, '.html'),
        filename: 'index.html',
        revision,
        buildMode,
        minify: {
          removeEmptyAttributes: function (attrName, tag) {
            return tag === 'script' && attrName === 'revision';
          }
        }
      })
    ]
  };

  if (buildMode === 'production') {
    obj.entry.push(`${__dirname}/src/babel-polyfill.js`);
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
