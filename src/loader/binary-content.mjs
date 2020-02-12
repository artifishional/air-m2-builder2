import {readFile} from 'fs';
import {getResourceResolvePath} from "../utils.mjs";

export default (resourceloader, {path}, {url}) => new Promise(resolve => {
        readFile(getResourceResolvePath({path, url}), (err, content) => resolve(content))
    }
)
