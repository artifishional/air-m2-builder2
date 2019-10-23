import csstree from "css-tree";

export default function({htmlText}) {
  const regex = new RegExp(`(?<=<style[a-z0-9="' ]*>)([\\s\\S]*?)(?=<\\/style>)`,'gi');
  let match;
  const asts = [];
  while ((match = regex.exec(htmlText))) {
    const css = match[0].replace(/:scope/g, '[data-scope-acid]');
    const ast = JSON.stringify(csstree.toPlainObject(csstree.parse(css)));
    asts.push({
      data: ast,
      idx: match.index,
      len: match[0].length
    });
  }

  return asts;
}