import { Utils } from '../utils.mjs';
import { extname } from 'path';

const utils = new Utils();

export default class Request {
  constructor ({ module, relativePath, dirname, units, currentModule, optional, buildMode, devServer }) {
    const extension = extname(relativePath);

    const resolvePath = ['.js', '.html'].includes(extension) ?
      `${dirname}/node_modules/${module}/${units.dir}/${relativePath}` :
      `${dirname}/node_modules/${module}/src/${relativePath}`;

    this.mode = module === currentModule ? 'currentModule' : 'request';

    const source = [...optional.values()].find(e => e.module === module);
    if (!source) {
      this.error = `ERROR '${module}': no install source error`;
    }

    this.options = {
      devServer,
      buildMode,
      source: this.error ? null : source.source,
      inputFile: `${dirname}/node_modules/${module}/src/${relativePath}`,
      outputFile: resolvePath,
      resolvePath,
      module,
      dirname,
      units,
      optional,
      relativePath
    };
  }
}
