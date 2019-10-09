import { existsSync, readFileSync } from 'fs';
import { basename, resolve } from 'path';
import { Utils } from '../src/utils.mjs';
import minimist from 'minimist';

const utils = new Utils();

const PORT = 9000;
const BUILDER_NAME = 'air-m2-builder2';
const PKG_REQUIRED_BY = '_requiredBy';

export default function serverConfig (options = {}) {

  const argv = minimist(process.argv.slice(2), {
    strings: ['build-mode'],
    boolean: ['dev-server'],
    default: {
      'build-mode': "",
      'dev-server': false
    }
  });
  
  const devServer = argv['dev-server'];
  const buildMode = argv['build-mode'] || argv['dev-server'] === true && "development" || "production";

  if(!["production", "development"].includes(buildMode)) {
    throw `unsupported build mode type: ${buildMode}`
  }

  if (!options.hasOwnProperty('customDir')) {
    options.customDir = false;
  }

  let entryUnit = 'master';
  const dirname = options.customDir ? options.customDir : resolve('.');
  const currentModule = basename(dirname);
  const units = { dir: 'm2unit', requires: 'm2units', dirS: 'm2units' };

  const revision = process.env.STATIC_VERSION || argv.revision || null;
  const gameConfigFilename = 'air-m2.config.json';
  const gameConfigPath = `${dirname}/${gameConfigFilename}`;
  let port = PORT;
  let master = null;
  const latency = [];
  // todo temporary hack
  master = 'gamex-builder';
  if (existsSync(gameConfigPath)) {
    const json = JSON.parse(readFileSync(gameConfigPath, 'utf8'));
    port = json.port || port;
    entryUnit = json['entry-unit'] || 'master';
    if (json.hasOwnProperty('master')) {
      master = json.master;
    }
    if (json.hasOwnProperty('latency') && json.latency instanceof Array) {
      latency.push(...json.latency);
    }
  }

  const pkgjsonPath = `${dirname}/node_modules/${BUILDER_NAME}/package.json`;
  if (master === null && existsSync(pkgjsonPath)) {
    const json = JSON.parse(readFileSync(pkgjsonPath, 'utf8'));
    if (
      json.hasOwnProperty(PKG_REQUIRED_BY) &&
      json[PKG_REQUIRED_BY] instanceof Array &&
      json[PKG_REQUIRED_BY].length > 0
    ) {
      const __required = json[PKG_REQUIRED_BY][0].match(/[\w-]+$/g);
      master = __required === null ? currentModule : __required[0];
    } else {
      throw 'Error: Cannot find source of \'m2.js\' file.';
    }
  }

  const optional = new Set();
  const unitsPath = `${dirname}/${units.dirS}.json`;
  if (existsSync(unitsPath)) {
    const additionals = utils.getAdditional(unitsPath, units.requires, true);
    if (additionals != null) {
      utils.addUnique(optional, additionals);
    }
  }
  if (existsSync(`${dirname}/package.json`)) {
    const additionals = utils.getAdditional(`${dirname}/package.json`, units.requires);
    if (additionals != null) {
      utils.addUnique(optional, additionals);
    }
  }
  if (master !== currentModule) {
    const pkgjsonPath = `${dirname}/node_modules/${master}/package.json`;
    if (existsSync(pkgjsonPath)) {
      const additionals = utils.getAdditional(pkgjsonPath, units.requires);
      if (additionals != null) {
        utils.addUnique(optional, additionals);
      }
    }
  }

  const masterPath = [`${dirname}/${master === currentModule ? '' : `node_modules/${master}`}`, '/src/m2.js'];
  if (!existsSync(masterPath.join(''))) {
    throw `Error: Cannot find 'm2.js' on source '${masterPath.join('')}'`;
  }

  return {
    entryUnit,
    port,
    buildMode,
    devServer,
    dirname,
    currentModule,
    master,
    masterPath,
    units,
    optional,
    latency,
    execute: options.execute,
    revision
  };
}
