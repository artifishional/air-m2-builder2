import {lookupMIMEType, FileReader} from "../utils";


function createPrioritySystemStyle (priority) {
	while (PRIORITY.length < priority + 1) {
		const style = document.createElement('style');
		PRIORITY.push(style);
		style.setAttribute('data-priority', `${PRIORITY.length - 1}`);
		PRIORITY[PRIORITY.length - 2].before(style);
	}
}

function inject (style, priority) {
	createPrioritySystemStyle(priority);
	PRIORITY[priority].after(style);
}

const PRIORITY = [];

export default (resourceloader, {path}, { acid, priority, style, revision, ...args }) => {
		if (!PRIORITY[0]) {
			const zero = document.createElement('style');
			zero.setAttribute('data-priority', '0');
			document.head.append(zero);
			PRIORITY[0] = zero;
		}

		const promises = [];

		const dataForLoading = [];
		let rawCommonCSSContent = '';
		const commonStyle = document.createElement('style');
		commonStyle.textContent = '';
		rawCommonCSSContent = style.textContent.replace(/:scope/g, `[data-scope-acid-${acid}]`);
		const imageRegex = /\/\*\s<image\surl=\"([^"]+)">\s\*\//gm;
		const matches = rawCommonCSSContent.matchAll(imageRegex);
		if (matches) {
			for (const match of matches) {
				dataForLoading.push({
					type: 'image',
					placeholder: match[0],
					resource: match[1]
				});
			}
		}

		promises.push(...dataForLoading.map(({ type, placeholder, resource: url }) => {
			if (type === 'image') {
				return resourceloader(resourceloader, {path}, {url, type: 'binary-content'})
					.then(binaryContent => new Blob(binaryContent, {type: lookupMIMEType({url})}))
					.then(FileReader)
					.then(({target: {result: base64}}) => {
						while (~rawCommonCSSContent.indexOf(placeholder)) {
							rawCommonCSSContent = rawCommonCSSContent.replace(placeholder, base64);
						}
					});
			}
		}));

		return Promise.all(promises).then(() => {
			commonStyle.textContent = rawCommonCSSContent;
			inject(commonStyle, priority);
			return { type: 'inline-style', style: commonStyle, ...args };
		});

		// sweep.add(() => {
		// 	commonStyle.remove();
		// 	fontFaceStyle && fontFaceStyle.remove();
		// });
}
