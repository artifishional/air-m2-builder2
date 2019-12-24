import binaryContent from './binary-content.mjs';
import scriptLoader from './script_like_promise';
import inlineStyleLoader from "./inline-style";
import imageLoader from './image';

export default function (resourceloader, { path }, { type, ...args }) {
  if (type === "content") {
    return resourceloader(resourceloader, {path}, {type: 'binary-content', ...args})
      .then(data => data.toString());
  } else if (type === 'binary-content') {
    return binaryContent({path}, {type, ...args});
  } else if (type === 'script') {
    return scriptLoader(resourceloader, {path}, {type, ...args});
  } else if (type === "inline-style") {
    return inlineStyleLoader(resourceloader, {path}, { type, ...args });
  } else if (type === "img") {
    return imageLoader(resourceloader, {path}, { type, ...args });
  } else {
    throw "unsupported resource type";
  }
}
