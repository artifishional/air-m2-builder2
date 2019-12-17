import path from 'path';
import webpack from 'webpack';
import webpackConfig from '../webpack.config.js';
import webpackCompileConfig from '../webpack-compiler.config.mjs';
import WebpackDevServer from 'webpack-dev-server';
import App from '../src/app.mjs';
import BuildProd from '../src/buildprod.mjs';
import after from '../src/after.mjs';

export default class DevServer {
  constructor (options) {
    this.options = options;
  }

  precompile () {
    const { buildMode, devServer, dirname, currentModule } = this.options;

    return new Promise((res, rej) => {
      webpack(webpackConfig(buildMode, devServer, dirname, this.options)).run((err, stats) => {
        if (stats.compilation.errors.length) throw new Error(stats.compilation.errors);
        if (err) throw new Error(err);

        const compileOpt = {
          buildMode,
          entry: `${dirname}/src/index.js`,
          path: path.resolve(dirname, './dist/'),
          filename: `${currentModule}/index.js`
        };
        this.compiler = webpack(webpackCompileConfig(compileOpt));

        res();
      });
    });
  }

  build () {
    new BuildProd(this.options).next();
  }

  run () {
    const {
      dirname,
      units,
      currentModule,
      optional,
      latency,
      port,
      execute,
      buildMode,
      devServer,
      cacheDir
    } = this.options;

    const app = new App({ execute, cacheDir });

    const server = new WebpackDevServer(this.compiler, {
      headers: { 'Access-Control-Allow-Origin': '*' },
      disableHostCheck: true,
      stats: { colors: true },
      contentBase: [`${dirname}/dist`, `${dirname}/src`],
      publicPath: `/${units.dirS}/`,
      hot: true,
      inline: true,
      watchContentBase: true,
      after: after({ app, buildMode, cacheDir, currentModule, devServer, dirname, latency, optional, units })
    });

    server.listen(port, '0.0.0.0', err => {
      if (err) throw err;
      console.log(`Starting root server on 0.0.0.0:${port}`);
    });
  }
}
