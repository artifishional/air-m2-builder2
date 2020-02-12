import webpack from 'webpack';
import webpackCompileConfig from '../webpack-compiler.config.mjs';
import { dirname, normalize, relative, resolve, sep } from 'path';
import fs from 'fs';
import glob from 'glob';
import sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import csstree from 'css-tree';
import { cacheHash } from './utils.mjs';

const SOURCE_TYPES = ['js', 'jsx', 'scss'];
const REGEXPS = {
  js: ['(?<=<script>)([\\s\\S]*?)(?=<\\/script>)', '(?<=<view-source>)([\\s\\S]*?)(?=<\\/view-source>)', '(?<=<stream-source>)([\\s\\S]*?)(?=<\\/stream-source>)'],
  jsx: ['(?<=<react-source>)([\\s\\S]*?)(?=<\/react-source>)'],
  scss: [`(?<=<style[a-z0-9="' ]*type\\s*=\\s*["']?\\s*text\\/scss\\s*["']?[a-z0-9="' ]*>)([\\s\\S]*?)(?=<\\/style>)`]
};

class CompileResource {
  run () {
    return new Promise(resolve => {
      resolve();
    });
  }
}

class CompileSource {
  constructor (opt, { path, entry }) {
    this.opt = opt;

    const compileOpt = {
      buildMode: this.opt.buildMode,
      path,
      entry,
      filename: 'index.js'
    };
    this.config = webpackCompileConfig(compileOpt);
  }

  run () {
    return new Promise((res, rej) => {
      console.log(`compile: ${this.opt.module} ...`);

      const compiler = webpack(this.config);

      compiler.run((error, stats) => {
        if (stats.hasErrors()) {
          console.log(`ERROR: ${this.opt.module} compile error`);
          console.log(stats.compilation.errors);
          rej(`ERROR '${this.opt.module}': compile error`);
          return;
        }

        console.log(`compile: ${this.opt.module} -- ok`);
        res();
      });
    });
  }
}

class CompileHtml {
  constructor ({ buildMode, module, cacheDir = false, inputFile, outputFile, importPathResolve = null }) {
    this.inputFile = inputFile;
    this.outputFile = outputFile;
    this.buildMode = buildMode;
    this.module = module;
    this.buildDir = ~inputFile.indexOf('node_modules') ? dirname(inputFile) : dirname(outputFile);
    this.cacheDir = cacheDir;
    this.importPathResolve = importPathResolve;
  }

  configureCompiler ({ htmlSource, source, type, start, length }) {
    const { buildMode, buildDir, cacheDir } = this;

    if (['js', 'jsx'].includes(type) && this.importPathResolve) {
      source = this.importPathResolve(source);
    }

    const hash = cacheHash(source, { sourcePath: buildDir, type, recursive: !!cacheDir });
    const filename = `.tmp-${hash}.${type}`;
    const filenameBundle = `.tmp-${hash}-bundle.compiled`;

    const meta = {
      file: `${buildDir}/${filenameBundle}`,
      start,
      length
    };

    if (cacheDir && fs.existsSync(`${cacheDir}/${filenameBundle}`)) {
      return new Promise((resolve) => {
        const data = fs.readFileSync(`${cacheDir}/${filenameBundle}`);
        resolve({ ...meta, data });
      });
    } else {
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
      }

      if (type === 'scss') {
        return new Promise((resolve) => {
          sass.render({ data: this.processSassImports(source) }, (err, result) => {
            if (err) {
              console.log(`Sass compile error:\n${err}`, buildDir);
            } else {
              postcss([autoprefixer])
                .process(result.css.toString(), { from: undefined })
                .then(({ css }) => {
                  css = this.processCssPath(css);
                  css = this.processCssResources(css);
                  if (cacheDir) {
                    fs.writeFileSync(`${cacheDir}/${filenameBundle}`, css, 'utf8');
                  }
                  resolve({ ...meta, data: css });
                });
            }
          });
        });
      } else if (['js', 'jsx'].includes(type)) {

        fs.writeFileSync(`${buildDir}/${filename}`, source, 'utf8');

        const config = webpackCompileConfig({
          buildMode,
          path: normalize(buildDir),
          entry: `${buildDir}/${filename}`,
          filename: filenameBundle,
        });

        const compiler = webpack(config);

        return new Promise((resolve, reject) => {
          compiler.run(async (error, stats) => {
            if (stats.hasErrors()) {
              console.log(`ERROR: ${compiler.options.entry} compile error`);
              reject(`ERROR '${compiler.options.entry}': compile error`);
            } else {
              const data = fs.readFileSync(meta.file);
              if (cacheDir) {
                fs.writeFileSync(`${cacheDir}/${filenameBundle}`, data);
              }

              resolve({
                ...meta,
                data: data.toString()
              });
            }
          });
        });
      }
    }
  };

  extractSources (htmlSource, regexps) {
    return regexps.map((regexp) => {
      const reg = new RegExp(regexp, 'gi');
      const acc = [];
      let match;
      while ((match = reg.exec(htmlSource)) !== null) {
        acc.push(match);
      }
      return acc;
    })
      .reduce((acc, matches) => Array.isArray(matches) ? [...acc, ...matches] : acc, [])
      .filter(Boolean);
  }

  processSassImports (scss) {
    return scss.replace(/(?:@import ["'])(\S+)(?:["'];)/g, (match, importPath) => {
      // абсолютный путь до файла со стилями
      const absoluteScssPath = resolve(dirname(this.inputFile), importPath).replace(/\\/g, '/');
      // относительный путь между модулем и файлом со стилями
      let rel = relative(dirname(this.inputFile), dirname(absoluteScssPath));
      return `/* <import rel="${rel}"> */ @import "${absoluteScssPath}"; /* </import> */`;
    });
  }

  resolveAbsoluteResourcePath (url) {
    let filePath, rel;
    if (this.buildMode === 'development') {
      filePath = dirname(this.inputFile);
      rel = relative(filePath, filePath.substr(0, filePath.indexOf('src') + 4));
    } else {
      filePath = dirname(this.outputFile);
      rel = relative(filePath, filePath.substr(0, filePath.lastIndexOf(this.module) + this.module.length + 1));
    }
    return `${rel}${url}`;
  }

  processCssPath (css) {
    const regex = /(?:\/\* <import rel="([^"]+)"> \*\/)([\s\S]*?)(?:\/\* <\/import> \*\/)/gm;
    return css.replace(regex, (full, rel, match) => {
      const ast = csstree.parse(match);
      csstree.walk(ast, (node) => {
        if (node.type === 'Url') {
          const value = node.value;
          let url = (value.type === 'Raw' ? value.value : value.value.substr(1, value.value.length - 2));
          if (url.indexOf('data:') > -1) return;

          node.value.value = url[0] === '/'
            ? this.resolveAbsoluteResourcePath(url)
            : `${rel}${sep}${url}`;

        }
      });
      return csstree.generate(ast);
    });
  }

  processCssResources (css) {
    const ast = csstree.parse(css);

    csstree.walk(ast, function (node) {
      if ((this.rule || this.atrule && this.atrule.name === 'media') && node.type === 'Url') {
        let url = (node.value.type === 'Raw' ? node.value.value : node.value.value.substr(1, node.value.value.length - 2));
        if (url.indexOf('data:') === -1) {
          node.value.value = `/* <image url="${url}"> */`;
        }
      }
    });

    return csstree.generate(ast);
  }

  run () {
    const { inputFile, outputFile } = this;

    try {
      let htmlSource = fs.readFileSync(inputFile, 'utf8');

      const sources = SOURCE_TYPES.map((type) => ({
        type,
        matches: this.extractSources(htmlSource, REGEXPS[type])
      }));

      const promises = sources
        .map(({ type, matches }) => matches.map((match) => this.configureCompiler({
            htmlSource,
            type,
            source: match[0],
            start: match.index,
            length: match[0].length
          })
        ))
        .reduce((acc, promises) => Array.isArray(promises) ? [...acc, ...promises] : acc, []);

      return new Promise((resolve, reject) => {
        Promise.all(promises).then((compiled) => {
          const outputHtml = compiled
            .sort((a, b) => b.start - a.start)
            .reduce((outputHtml, { start, length, data }) => outputHtml.slice(0, start) + data + outputHtml.slice(start + length), htmlSource)
            .replace(/\s*type\s*=\s*["']?\s*text\/scss\s*["']?\s*/g, ' ')
            .replace(/<view-source>/gi, '<script data-source-type="view-source">')
            .replace(/<\/view-source>/gi, '</script>')
            .replace(/<react-source>/gi, '<script data-source-type="view-source">')
            .replace(/<\/react-source>/gi, '</script>')
            .replace(/<stream-source>/gi, '<script data-source-type="stream-source">')
            .replace(/<\/stream-source>/gi, '</script>');

          if (!fs.existsSync(dirname(outputFile))) {
            fs.mkdirSync(dirname(outputFile), { recursive: true });
          }
          fs.writeFileSync(outputFile, outputHtml, 'utf8');

          glob(`${this.buildDir}/.tmp*.*`, {}, (err, files) => {
            if (err) throw err;
            files.map(file => fs.unlinkSync(file, () => {}));
          });

          resolve(outputHtml);
        });
      });
    } catch (err) {
      throw new Error(err);
    }
  }
}

export { CompileSource, CompileResource, CompileHtml };