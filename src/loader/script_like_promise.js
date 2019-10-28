function executeModule(scriptContent, reject) {
    window.eval(scriptContent);
    return window.__m2unit__;
}

export default function (resourceloader, {path}, {url, scriptContent}) {
    if (scriptContent) {
        return executeModule(scriptContent, () => {});
    }
    return new Promise(async (resolve, reject) => {
        scriptContent = await resourceloader(resourceloader, {path}, {url, type: 'content'});
        resolve({module: executeModule(scriptContent, reject)});
    });
}
