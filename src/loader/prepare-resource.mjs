import App from '../app.mjs';
import {executeDev, getAdditional, addUnique, importPathResolve, getResourceInfo} from '../utils.mjs';
import {dirname as projectDirname, units} from './values.mjs';
import {existsSync} from 'fs';
import {CompileHtml, CompileSource} from '../compile.mjs';
import {dirname} from 'path';

const {requester} = new App({execute: executeDev});

const optional = new Set();
const unitsPath = `${projectDirname}/${units.requires}.json`;
if (existsSync(unitsPath)) {
  const additionals = getAdditional(unitsPath, units.requires, true);
  if (additionals != null) {
    addUnique(optional, additionals);
  }
}
if (existsSync(`${projectDirname}/package.json`)) {
  const additionals = getAdditional(`${projectDirname}/package.json`, units.requires);
  if (additionals != null) {
    addUnique(optional, additionals);
  }
}

export default function prepareResource({path: urlPath, url}) {
  const {extension, mode, resolvePath, module, relativePath} = getResourceInfo({path: urlPath, url});
  if (mode === 'currentModule') {
    const inputFile = `${projectDirname}/src/${relativePath}`;
    if (extension === '.html') {
      return new CompileHtml({
        module,
        inputFile,
        outputFile: resolvePath,
        importPathResolve: importPathResolve(inputFile),
      }).run();
    } else if (extension === '.js') {
      const {source} = [...optional.values()].find(e => e.module === module);
      return new CompileSource(
        {module, source, dirname: projectDirname, units, optional, resolvePath, buildMode: 'development', devServer: true,},
        { entry: dirname(inputFile), path: dirname(resolvePath) }
      ).run();
    } else {
      return Promise.resolve();
    }
  } else {
    const {source} = [...optional.values()].find(e => e.module === module);
    return requester.get({
      module,
      source,
      dirname: projectDirname,
      units,
      optional,
      resolvePath,
      buildMode: 'development',
      devServer: true,
      inputFile: `${projectDirname}/node_modules/${module}/src/${relativePath}`,
      outputFile: resolvePath,
    });
  }
}
