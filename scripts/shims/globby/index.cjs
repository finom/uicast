const { globSync } = require('tinyglobby');

// globby neither expands directory patterns nor ends directory paths with a slash
const trim = (paths) => paths.map((p) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p));

exports.sync = (patterns, options) => trim(globSync(patterns, { expandDirectories: false, ...options }));
