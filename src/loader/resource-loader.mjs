import { REVISION as revision, PORT as port } from 'air-m2/src/globals';
import after from './after.mjs';
import mime from 'mime';

export default function (resourceloader, { path }, { type, url, ...args }) {
  const {protocol, hostname} = window.location;
  const urlOrigin = port ? `${protocol}//${hostname}:${port}` : window.location.origin;
  if (type === "content") {
    return after({path}, {type, url, ...args})
      .then(arrayBuffer => arrayBuffer.toString());
  } else if (type === 'array-buffer') {
    return after({path}, {type, url, ...args})
      .then(arrayBuffer => ({arrayBuffer, type: mime.getType(url)}));
  } else {
    throw "unsupported resource type";
  }
}
