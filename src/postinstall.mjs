import { existsSync, readFileSync } from 'fs';
import { CompileHtml, CompileResource, CompileSource } from './compile.mjs';
import { addUnique, getAdditional } from './utils.mjs';
import { extname } from 'path';

export default opt => {
  const { devServer, dirname, module, units, optional, resolvePath } = opt;

  const pkgPath = `${dirname}/node_modules/${module}/package.json`;
  if (!existsSync(pkgPath)) {
    throw `ERROR: file not found '${pkgPath}'`;
  }

  const additionals = getAdditional(pkgPath, units.requires);
  if (additionals != null) {
    addUnique(optional, additionals);
  }

  const pkg = readFileSync(pkgPath, 'utf8');
  const { main } = JSON.parse(pkg);
  const extensionMain = extname(main);
  const extensionPath = extname(resolvePath);

  let Compiler;
  if (extensionPath === '.html') {
    Compiler = CompileHtml;
  } else if (extensionPath === '.js') {
    Compiler = CompileSource;
  } else {
    Compiler = CompileResource;
  }
  if (!devServer && extensionMain !== '.js') {
    Compiler = CompileResource;
  }

  const path = devServer ? `${dirname}/node_modules/${module}/${units.dir}` : `${dirname}/dist/${units.dirS}/${module}`;
  const entry = `${dirname}/node_modules/${module}/${main}`;

  return { Compiler, paths: { path, entry } };
};
