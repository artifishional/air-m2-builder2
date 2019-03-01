import path from "path";
import webpack from "webpack";
import webpackConfig from "../webpack.config.js";
import webpackCompileConfig from "../webpack-compiler.config.mjs";
import WebpackDevServer from "webpack-dev-server";
import after from "../src/app.mjs";
import prod from "../src/prod.mjs";

export default class DevServer {
  constructor(options) {
    this.opt = options;
    const { mode, dirname, masterPath, currentName } = this.opt;

    webpack(webpackConfig(mode, dirname, masterPath)).run(function(err) {
      if (err) throw err;

      const compileOpt = {
        mode,
        entry: `${dirname}/src/index.js`,
        path: path.resolve(dirname, "./dist/"),
        filename: `${currentName}/index.js`
      };
      this.compiler = webpack(webpackCompileConfig(compileOpt));
    });
  }

  build() {
    const { dirname, currentName, units, optional } = this.opt;

    prod({ dirname, currentName, units, optional });
  }

  run() {
    const { dirname, master, units, currentName, optional, port } = this.opt;

    const server = new WebpackDevServer(this.compiler, {
      headers: { "Access-Control-Allow-Origin": "*" },
      disableHostCheck: true,
      stats: { colors: true },
      contentBase: `${dirname}/node_modules/${master}/dist`,
      publicPath: `/${units.dirS}/`,
      hot: true,
      inline: true,
      watchContentBase: true,
      after: after({ dirname, currentName, units, optional })
    });

    server.listen(port, "0.0.0.0", err => {
      if (err) throw err;
      console.log(`Starting root server on 0.0.0.0:${port}`);
    });
  }
}
