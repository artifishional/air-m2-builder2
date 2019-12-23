import after from './after.mjs';
import mime from 'mime';
import scriptLoader from './script_like_promise';

export default function (resourceloader, { path }, { type, url, ...args }) {
  if (type === "content") {
    return after({path}, {type, url, ...args})
      .then(arrayBuffer => arrayBuffer.toString());
  } else if (type === 'array-buffer') {
    return after({path}, {type, url, ...args})
      .then(arrayBuffer => ({arrayBuffer, type: mime.lookup(url)}));
  } else if (type === 'script') {
    return scriptLoader(resourceloader, {path}, {type, url, ...args});
  } else if (type === 'img') {
    return after({path}, {type, url, ...args})
        .then((data) => new Buffer(data));
  } else {
    throw "unsupported resource type";
  }
}
