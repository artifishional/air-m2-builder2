import binaryContent from './binary-content.mjs';
import inlineStyleLoader from "./inline-style";
import imageLoader from './image';
import styleLoader from './style';

export default function (resourceloader, { path }, { type, url, ...args }) {
  if (type === "content") {
    return resourceloader(resourceloader, {path}, {type: 'binary-content', url, ...args})
      .then(binaryContent => binaryContent.toString());
  } else if (type === 'binary-content') {
    return binaryContent(resourceloader, {path}, {type, url, ...args});
  } else if (type === "inline-style") {
    return inlineStyleLoader(resourceloader, {path}, { type, url, ...args });
  } else if (type === 'img') {
    return imageLoader(resourceloader, {path}, { type, url, ...args });
  } else if (type === 'style') {
    return styleLoader(resourceloader, {path}, { type, url, ...args });
  } else {
    throw "unsupported resource type";
  }
}
