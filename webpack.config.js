const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs');

module.exports = (buildMode, devServer, dirname, { m2path, entryUnit, revision = null }) => {
  const obj = {
    mode: buildMode,
    entry: [`${__dirname}/src/m2.js`, `${m2path}/m2.js`],
    externals: {
      m2: '__M2'
    },
    output: {
      path: `${dirname}/dist`,
      filename: 'm2.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        entryUnit,
        inject: false,
        hash: true,
        template: `${m2path}/m2.html`,
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

  if (fs.existsSync(`${m2path}/res`)) {
    obj.plugins.push( new CopyPlugin([
      { from: `${m2path}/res`, to: `${dirname}/dist/res` },
    ]))
  }

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
    obj.entry.push(`${__dirname}/src/babel-polyfill.js`);
    obj.module.rules.push({
        test: /\.m?js$/,
        use: [
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
          },
          {
            loader: 'air-m2-builder2/src/webpack-strip-block.js',
            options: {
              blocks: [
                ['<debug>', '</debug>'],
                ['<@debug>', '</@debug>'],
                ['debug:start', 'debug:end'],
              ]
            }
          },
        ]
      }
    );
  }

  return obj;
};
