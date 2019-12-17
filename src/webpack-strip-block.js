/*jslint node:true */
"use strict";

const loaderUtils = require("loader-utils");

function StripBlockLoader(content) {
  const options = loaderUtils.getOptions(this) || { blocks: [] };
  options.blocks.map(([startComment, endComment]) => {
    const regexPattern = new RegExp("[\\t ]*\\/\\* ?" + startComment + " ?\\*\\/[\\s\\S]*?\\/\\* ?" + endComment + " ?\\*\\/[\\t ]*\\n?", "gi");
    content = content.replace(regexPattern, '');
  });

  if (this.cacheable) {
    this.cacheable(true);
  }

  return content;
}

module.exports = StripBlockLoader;
