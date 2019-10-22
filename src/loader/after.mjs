import Request from './request.mjs';
import { CompileHtml } from '../compile.mjs';
import { Utils, UtilsDev } from '../utils.mjs';
import serverConfig from "../serverConfig.mjs";
import App from "./app";
import fs from 'fs';
import path from 'path';
import {CompileSource} from "../compile";

export default function after ({path: pathStr}, {url}) {
  return new Promise(resolve => {
    const {
      dirname,
      currentModule,
      units,
      optional,
      latency,
      execute,
    } = serverConfig({ execute: UtilsDev.execute });

    const buildMode = 'development';
    const devServer = true;

    const app = new App({ execute });
    const { requester, installer } = app;

    function sendResolve ({ source, method, delay }) {
      if (delay === 0) {
        if (method === 'data') {
          resolve(source);
        } else if (method === 'file') {
          fs.readFile(source, (err, fileContent) => resolve(fileContent));
        }
      } else {
        if (method === 'data') {
          setTimeout(() => {
            resolve(source);
          }, delay);
        } else if (method === 'file') {
          setTimeout(() => {
            fs.readFile(source, (err, fileContent) => resolve(fileContent));
          }, delay);
        }
      }
    }

    const request = new Request({ url: pathStr + url, dirname, units, currentModule, optional, execute, buildMode, devServer });

    const utils = new Utils();
    const { resolvePath } = request.options;
    const filePath = utils.removeQueryString(`${dirname}/src/${request.options.relativePath}`);

    let i = 0;
    let match = null;
    let delay = 0;
    while (match === null && i < latency.length) {
      match = filePath.match(new RegExp(latency[i++].regex));
    }
    if (match !== null) {
      delay = latency[i - 1].delay || 0;
    }

    if (request.mode === 'currentModule') {
      if (path.extname(filePath) === '.html') {
        const importPathResolve = (data) => {
          const regex = /import\s(?:["'\s]*[\w*{}\$\n\r\t, ]+from\s*)?["'\s]*([^"']+)["'\s]/gm;
          const sourceDir = path.dirname(filePath);
          return data.replace(regex, (match, importPath) => {
            let res = match;
            if (~importPath.indexOf('./')) {
              res = match.replace(importPath, path.resolve(`${sourceDir}/${importPath}`));
              res = res.replace(/\\/g, '/');
            }
            return res;
          });
        };

        new CompileHtml({
          ...request.options,
          inputFile: filePath,
          outputFile: utils.removeQueryString(resolvePath),
          importPathResolve
        })
          .run()
          .then(htmlText => {
            sendResolve({ source: htmlText, method: 'data', delay });
          });
      } else if (path.extname(filePath) === '.js') {
        const compiledFileDir = `${dirname}/node_modules/${currentModule}/m2unit`;
        new CompileSource({module: request.options.module, buildMode, }, {
          entry: filePath,
          path: compiledFileDir,
        })
          .run()
          .then(() => {
            sendResolve({ source: `${compiledFileDir}/index.js`, method: 'file', delay });
          });
      } else {
        sendResolve({ source: filePath, method: 'file', delay });
      }

      return;
    }
    if (request.error) {
      console.log(request.error);
      sendResolve({ source: request.error, method: 'data', delay });
      return;
    }


    requester
      .get(request.options)
      .then(() => {
        return sendResolve({ source: utils.removeQueryString(resolvePath), method: 'file', delay });
      })
      .catch(error => {
        installer.deleteInstance(`${request.options.module}/${request.options.relativePath}`);
        sendResolve({ source: error, method: 'data', delay });
      });
  });
}
