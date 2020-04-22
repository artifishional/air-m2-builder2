import { Howl } from "howler";

export default ( {path}, { revision, rel, ...args } ) =>
  Promise.resolve({url: `${path}${rel}`, type: "sound", sound: {play(){}}, ...args});