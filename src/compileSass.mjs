import sass from 'dart-sass';
import path from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import csstree from 'css-tree';

export default class CompileSass {
  constructor ({ htmlText, filePath }) {
    this.filePath = filePath;
    this.css = [];
    this.scss = [];
    const regex = new RegExp(`(?<=<style[a-z0-9="' ]*type\\s*=\\s*["']?\\s*text\\/scss\\s*["']?[a-z0-9="' ]*>)([\\s\\S]*?)(?=<\\/style>)`,'gi');
    let match = null;
    while ((match = regex.exec(htmlText))) {
      this.scss.push({
        cssIndex: this.scss.length,
        data: this.processImports(match[0]),
        idx: match.index,
        len: match[0].length
      })
    }
  }

  processImports (scss) {
    return scss.replace(/(?:@import ["'])(\S+)(?:["'];)/g, (match, importPath) => {
      const lvl = (importPath.match(/\.\.\//g) || []).length;
      const rel = new Array(lvl).fill('../').join('') || './';
      return `/* <import rel="${rel}"> */ @import "${path.resolve(this.filePath, importPath).replace(/\\/g, '/')}"; /* </import> */`;
    });
  }

  processPath (css) {
    const regex = /(?:\/\* <import[a-z0-9="' ]*rel\s*=\s*["']?\s*([a-zA-Z0-9.\/]*)\s*["']?[a-z0-9="' ]*> \*\/)([\s\S]*?)(?:\/\* <\/import> \*\/)/gm;

    return css.replace(regex, (full, rel, match) => {
      if (rel === './') return match;
      const ast = csstree.parse(match);
      csstree.walk(ast, (node) => {
        if (node.type === 'Url') {
          const value = node.value;
          let url = (value.type === 'Raw' ? value.value : value.value.substr(1, value.value.length - 2));
          if (url.indexOf('data:') > -1) return;
          node.value.value = `${rel}${url}`.replace(/\/\.\//g, '/');
        }
      });
      return csstree.generate(ast);
    });
  }

  compile () {
    const promises = [];
    this.scss.forEach(({ data }, i) => {
      promises.push(
        new Promise(res => {
          sass.render({
            data,
            importer(url, prev) {
              if (url.indexOf('file:///') !== -1) {
                return {file: url.replace('file:///', '')};
              } else {
                return {file: path.resolve(path.dirname(prev), url).replace(/\\/g, '/')};
              }
            }
          }, (err, result) => {
            if (err) {
              console.log(`Sass compile error:\n${err}`);
              this.css[i] = this.scss[i].data;
              res();
            } else {
              postcss([autoprefixer])
                .process(result.css.toString(), { from: undefined })
                .then(({ css }) => {
                  this.css[i] = this.processPath(css);
                  res();
                });
            }
          });
        })
      );
    });

    return promises;
  }
}
