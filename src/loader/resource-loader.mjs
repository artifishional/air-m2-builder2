import { REVISION as revision, PORT as port } from 'air-m2/src/globals';
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
  } else {
    throw "unsupported resource type";
  }
}
