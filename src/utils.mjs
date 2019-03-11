import { readFileSync } from "fs";
import path from "path";
import copyfiles from "copyfiles";
import { exec } from "child_process";

class Utils {
  getRandomInt(max, min = 0) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getAdditional(filename, requires, all = false) {
    let optDep;
    if (!all) {
      optDep = JSON.parse(readFileSync(filename, "utf8"))[requires];
    } else {
      optDep = JSON.parse(readFileSync(filename, "utf8"));
    }
    return optDep == null ? optDep : Object.keys(optDep).map(key => ({ module: key, source: optDep[key] }));
  }

  addUnique(opt, add) {
    const optMap = [...opt.values()].map(e => e.module);
    add.forEach(e => {
      if (!optMap.includes(e.module)) {
        opt.add(e);
      }
    });
  }

  copyFiles({ from, to, up }) {
    return new Promise(res => {
      copyfiles([from, to], { up }, err => {
        if (err) {
          throw err;
        }

        res();
      });
    });
  }

  getUp(from) {
    return from
      .replace(/\\/g, "/")
      .slice(0, from.indexOf("**"))
      .match(/\//g).length;
  }

  getExtension(str) {
    const match = str.match(/\.\w+$/g);

    return match ? match[0] : null;
  }
}

class UtilsDev extends Utils {
  static execute({ pkg }) {
    return new Promise(res => {
      const execString = `npm i --no-save --no-optional ${pkg}`;
      exec(execString, error => {
        res(error);
      });
    });
  }
}

class UtilsTest extends Utils {
  execute({ pkg, dirname }) {
    return new Promise(res => {
      const testDir = path.resolve(path.dirname(""));
      const unit = pkg.match(/[-\w]+$/)[0];
      const from = `${testDir}/${pkg}/**/*`;
      super.copyFiles({ from, to: `${dirname}/node_modules/${unit}`, up: super.getUp(from) }).then(error => {
        res(error);
      });
    });
  }
}

export { Utils, UtilsDev, UtilsTest };
