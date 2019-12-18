import postInstall from './postinstall.mjs';
import { existsSync } from 'fs';

export default class Install {
  constructor ({ execute }) {
    this.__packages = {};
    this.execute = execute;
  }

  go (options) {
    return this.prepare(options).then(() => {
      const {
        Compiler,
        paths: { path, entry }
      } = postInstall(options);
      return new Compiler(options, { path, entry }).run();
    });
  }

  prepare ({ devServer, dirname, module, source }) {
    if (!this.__packages[module]) {
      if (!devServer || !existsSync(`${dirname}/node_modules/${module}`)) {
        this.__packages[module] = {
          promise: this.install({ module, source }),
          status: 'pending'
        };
        return this.__packages[module].promise;
      } else {
        return new Promise((res) => res());
      }
    } else if (this.__packages[module].status === 'pending') {
      return this.__packages[module].promise;
    }
  }

  install ({ module, source }) {
    return new Promise((resolve, reject) => {
      console.log(`install: ${module} ...`);

      this.execute({ pkg: source }).then(error => {
        if (error) {
          reject(`ERROR: install error\n${module}\n${error}\n\n`);
          this.__packages[module].status = 'error';
          return;
        }
        this.__packages[module] = false;
        console.log(`install: ${module} -- ok`);
        resolve();
      });
    });
  }
}
