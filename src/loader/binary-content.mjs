import {readFile} from 'fs';
import {getResourceInfo} from "../utils.mjs";

export default (resourceloader, {path}, {url}) => new Promise(resolve => {
        readFile(getResourceInfo({path, url}).resolvePath, (err, content) => resolve(content))
    }
)
