import { extname } from 'path';

export default class Request {
  constructor (options) {
    const {
      req,
      dirname,
      units,
      currentModule,
      optional,
    } = options;
    const fullPath = dirname + req.originalUrl;
    const extension = extname(req.path);
    const match = req.path.match(/\/?[-\w]+\//g);
    const module = match && match.length > 1 ? match[1].slice(0, -1) : currentModule;
    const relativePath = fullPath.slice(fullPath.lastIndexOf(`/${module}/`) + module.length + 2);

    const resolvePath = ['.js', '.html'].includes(extension) ?
      `${dirname}/node_modules/${module}/${units.dir}/${relativePath}` :
      `${dirname}/node_modules/${module}/src/${relativePath}`;

    this.mode = module === currentModule ? 'currentModule' : 'request';

    const source = [...optional.values()].find(e => e.module === module);
    if (!source && this.mode !== 'currentModule') {
      this.error = `ERROR '${module}': no install source error`;
    }

    this.options = {
      ...options,
      source: source && source.source || null,
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
