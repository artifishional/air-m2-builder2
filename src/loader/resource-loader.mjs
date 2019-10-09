import { REVISION as revision, PORT as port } from 'air-m2/src/globals';
import after from './after.mjs';

export default function (resourceloader, { path }, { type, ...args }) {
  const {protocol, hostname} = window.location;
  const urlOrigin = port ? `${protocol}//${hostname}:${port}` : window.location.origin;
  if (type === "content") {
    return after({path}, {type, ...args});
  } else {
    throw "unsupported resource type";
  }
}
