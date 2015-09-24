import gulp from 'gulp';
import path from 'path';
import Metalsmith from 'metalsmith';
import _ from 'lodash';
import util from 'util';
import fs from 'fs';
import {setFileList, helpers} from "./helpers";

let $g = require('gulp-load-plugins')();
let $m = require('load-metalsmith-plugins')();

gulp.task('symlink-src', () => {

	let safeSym = (src, dest) => {
		try {
			fs.lstatSync(dest);
		} catch(e) {
			fs.symlinkSync(src,dest);
		}
	}

	// symlink the landing pages/custom content from the docs repo for each section
	safeSym("../repos/docs/learn", "src/learn")
	safeSym("../repos/docs/reference", "src/reference")
	safeSym("../repos/docs/tools", "src/tools")
	safeSym("../repos/docs/beyond-code", "src/beyond-code")

	// link up other repo's docs folder into the src structure
	return gulp.src("./repos/*/docs/")
		.pipe($g.sym(repoToSrc, {force: true, relative: true}));
})

gulp.task('build', ['symlink-src'], done => {
	

	let templateOptions = {
		engine: "handlebars",
		partials: "partials",
		helpers,
	};

	Metalsmith(__dirname)
		.metadata({
			host: "localhost:8000",
		})
		.use($m.metadata({
      sections: "sections.yaml",
    }))
		.use((f,m,d) => {
			setFileList(f);
			d();
		})
		.use(addProject)
		.use(addSection)
		.use(addLayout)
		.use(addDefaultTitles)
		.use(addExamples)
		.use($m.sass({
			outputStyle: "expanded",
			includePaths: [ "./node_modules", "./bower_components" ]
		}))
		.use($m.autoprefixer({ }))
		.use(renameReadme)
		.use($m.markdown())
		.use($m.inPlace(templateOptions))
		.use($m.layouts(templateOptions))
		.build(done);
});

gulp.task('serve', () => {
	gulp.src('./build')
    .pipe($g.webserver({
      livereload: true,
      open: "index.html",
    }));
});

function repoToSrc(file) {
	let project = file.relative.split(path.sep)[0];
	return path.join("src", project);
}

function addProject(files, metalsmith, done) {
	_.each(files, (f,p) => {
		let parts = p.split(path.sep);
		if (parts.length > 1) {
			f.project = parts[0]
		}
	})
	done();
}

function addLayout(files, metalsmith, done) {
	_.each(files, f => {
		if ("section" in f) {
			f.layout = f.section + ".handlebars";
		}
	})
	done();
}

function addDefaultTitles(files, metalsmith, done) {
	_.each(files, (f,p) => {
		if ("title" in f) return;
		console.log(`warn: ${p} has no title`);
		f.title = path.basename(p);
	})
	done();
}

function renameReadme(files, metalsmith, done) {
	let toReplace = _(files).keys().filter(p => path.basename(p) === "readme.md").value();
	_.each(toReplace, p => {
		let newPath = path.join(path.dirname(p), "index.md");
		files[newPath] = files[p];
		delete files[p];
	});
	done();
}





function addExamples(files, metalsmith, done) {
	//TODO: populate the examples metadata by parsing horizon-examples directory in each docs repo
	done();
}

function addSection(files, metalsmith, done) {
	_.each(files, (f,p) => {
		if (path.extname(p) !== ".md") {
			return;
		}

		let parts = p.split(path.sep);
		switch(parts[0]) {
			case "learn":
			case "reference":
			case "tools":
			case "beyond-code":
				f.section = parts[0];
				break;
			default:
				// if we're dealing with a document inside a project's /docs folder, don't assign a layout
				if (parts.length == 2) {
					return;
				}
				// if not one of the above cases, then we are dealing with a project-specific
				// file (i.e. horizon, js-stellar-sdk).  In this case, we determine layout
				// based upon the nesting undernearth the project name.
				f.section = parts[1];
				break;
		}
	});
	done();
}


function log(fn) {
	return function(files, metalsmith, done) {
		_.each(files, (f,p) => {
			console.log(`${p}: ${fn(f)}`);
		})
		done();
	};
}

function buildProjectIndex(files, metalsmith, done) {
	
	var index = {}
	_.each(files, (f,p) => {

	})
}





// TODO:
//   de-monkeypath readdir-recursive lfstat => fstat fix
//   live reload
//   source reorganization
//   rewrite link engine
//   example system
//   concat vendor.js
//   concat app.js
//   fingerprint assets
//   sidebar nav/file indexes
//   copy graphics files from solar module
//   run tests for link processor
//   


// Example design
//
// Each project that provides examples for horizon's endpoints will define a folder such as
// js-stellar-sdk/docs/horizon-examples/all-accounts.js
//
// the filename will be used for determining an examples file type
// metalsmith will be used to populate a metadata field with all examples, indexed by endpoint name
// each endpoint file can extract its examples using its name, then render them directly
//
