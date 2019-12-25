import {lookupMIMEType, FileReader} from "../utils.mjs";

export default (resourceloader, {path}, { origin, url, revision, ...args }) =>
  resourceloader(resourceloader, {path}, {url, type: 'binary-content'})
      .then(binaryContent => new Blob(binaryContent, {type: lookupMIMEType({url: origin.src})}))
      .then(FileReader)
      .then(({target: {result: base64}}) => {
        origin.src = base64;
        return {url, type: "img", image: origin, ...args};
      });
