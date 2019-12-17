import { existsSync } from 'fs';
import postInstall from './postinstall.mjs';

export default class Install {
  constructor ({ execute }) {
    this.__queue = [];
    this.__pending = false;
    this.execute = execute;
  }

  go (opt) {
    return this.install(opt).then(() => {
      const {
        Compiler,
        paths: { path, entry }
      } = postInstall(opt);

      return new Compiler(opt, { path, entry }).run();
    });
  }

  install (opt) {
    if (!opt.devServer || !existsSync(opt.dirname + `/node_modules/${opt.module}`)) {
      return this.pushRequest(opt);
    } else {
      return new Promise(res => {
        res(opt);
      });
    }
  }

  pushRequest (opt) {
    this.__queue.push(opt);

    if (!this.__pending) {
      this.__pending = true;
      this.promise = new Promise((res, rej) => {
        setTimeout(() => {
          this.run()
            .then(() => {
              res();
            })
            .catch(error => {
              rej(error);
            });
        }, 1000);
      });
    }

    return this.promise;
  }

  next (cb) {
    if (this.__queue.length > 0) {
      this.run().then(() => {
        cb();
      });
    } else {
      this.__pending = false;
      cb();
    }
  }

  run () {
    return new Promise((res, rej) => {
      const processing = this.__queue.splice(0, this.__queue.length);

      const pkgList = [...new Set(processing.map(({ source }) => source.trim()))];

      pkgList.forEach(p => {
        console.log(`install: ${p} ...`);
      });

      this.execute({ pkg: pkgList.join(' '), dirname: processing[0].dirname }).then(error => {
        if (error) {
          console.log(error);
          rej(`ERROR: install error\n${pkgList.join('\n')}`);
          this.__pending = false;
          return;
        }

        pkgList.forEach(p => {
          console.log(`install: ${p} -- ok`);
        });
        this.next(res);
      });
    });
  }
}
