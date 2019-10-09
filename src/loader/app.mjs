import { access, constants } from 'fs';
import Install from '../install.mjs';
import Cache from '../cache.mjs';

export default class App {
  constructor ({ execute }) {
    const install = new Install({ execute });
    this.installer = new Cache({ createInstance: opt => install.go(opt) });
    this.requester = new Cache({
      createInstance: ({ module, resolvePath, relativePath, ...options }) => {
        return new Promise((res, rej) => {
          this.installer
            .get({ module, resolvePath, relativePath, ...options })
            .then(() => {
              access(resolvePath, constants.F_OK, err => {
                this.requester.deleteInstance(`${module}/${relativePath}`);
                if (err) {
                  this.installer.deleteInstance(`${module}/${relativePath}`);
                  this.installer
                    .get({
                      module,
                      resolvePath,
                      relativePath,
                      ...options
                    })
                    .then(() => {
                      res();
                    })
                    .catch(() => {
                      this.requester.deleteInstance(`${module}/${relativePath}`);
                      rej();
                    });
                } else {
                  res();
                }
              });
            })
            .catch(() => {
              this.requester.deleteInstance(`${module}/${relativePath}`);
              rej();
            });
        });
      }
    });
  }
}
