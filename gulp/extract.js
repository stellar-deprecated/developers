import _ from "lodash";
import minimatch from "minimatch";
import path from "path";

let languageMap = {
	".js":    "javascript",
	".rb":    "ruby",
	".curl":  "curl",
	".go":    "go",
}

// Collects any files underneath a `horizon-examples` directory into
// a central metadata field for use when rendering a horizon "endpoint"
// page.
//
// Each example file is matched to the corresponding endpoint by file name.
// The examples language is deduced via the file extension.
module.exports.examples = function(files, metalsmith, done) {
	let metadata = metalsmith.metadata();
	let exampleFiles = glob(files, "**/horizon-examples/*.*")

	let results = {};
	metadata.examples = results;

	_.each(exampleFiles, (f,p) => {
		delete files[p];
		let ext = path.extname(p)
		let language = languageMap[ext];
		let endpoint = path.basename(p).slice(0, -ext.length);
		if (!language) {
			console.log(`warn: no languageMap entry for ${ext}`);
		}

		results[endpoint] = results[endpoint] || {}
		results[endpoint][language] = f;
	});

	done();
}

function glob(files, pattern) {
	let results = {};
	_.each(files, (f,p) => {
		if (!minimatch(p,pattern)) return;
		results[p] = f;
	})
	return results;
}
