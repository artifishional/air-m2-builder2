export default (resourceloader, {path}, {urlOrigin, url, revision, ...args}) => {
  const style = document.createElement("link");
  style.setAttribute("rel", "stylesheet");
  document.head.append(style);
  return resourceloader(resourceloader, {path}, {urlOrigin, url, revision, ...args, type: 'content'})
    .then(styleContent => {
      style.textContent = styleContent;
      return {url, type: "style", style, ...args};
    });
  // todo
  // sweep.add(() => style.remove());
};