import {basename, extname, resolve} from "path";

const IMGPreloaderSheet = document.createElement("style");
const IMGSStore = new Set();

document.head.append(IMGPreloaderSheet);

export default (resourceloader, {path}, { origin, url, revision, ...args }) => new Promise(res => {
  const dirname = resolve('.');
  const currentModule = basename(dirname);
  const {pathname} = new URL(path + url.replace(/"/g, ''), 'file://');
  const extension = extname(pathname);
  const match = pathname.match(/[-\w]+\//g);
  const module = match && match.length > 0 ? match[0].slice(0, -1) : currentModule;
  const relativePath = pathname.slice(pathname.lastIndexOf(`/${module}/`) + module.length + 2);
  const mode = currentModule === module ? 'currentModule' : 'request';
  if (mode === 'currentModule') {
    url = `file://${dirname}/src/${relativePath}`;
  } else {
    url = ['.js', '.html'].includes(extension) ?
        `file://${dirname}/node_modules/${module}/m2units/${relativePath}` :
        `file://${dirname}/node_modules/${module}/${relativePath}`;
  }
  if(IMGSStore.has(url)) {
    const image = new Image();
    image.src = url;
    res( {url, type: "img", image, ...args} );
  }
  else {
    IMGSStore.add(url);
    const image = new Image();
    origin && [...origin.attributes].map( ({ name, value }) => {
      if(name === "srcset") {
        console.warn("'srcset' img property currently is not supported");
      }
      else if(name !== "src") {
        image.setAttribute(name, value);
      }
    } );
    // image.src = url;
    image.onload = () => {
      debugger;
      res( {url, type: "img", image, ...args} );
    };
    image.src = url;
    IMGPreloaderSheet.textContent = `
        body:after {
        display:none;
        content: url(${ [...IMGSStore].join(") url(")});
    }`;
  }
})
