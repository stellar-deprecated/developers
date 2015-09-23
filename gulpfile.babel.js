import gulp from 'gulp';
import path from 'path';
import Metalsmith from 'metalsmith';
import _ from 'lodash';
import util from 'util';

let $g = require('gulp-load-plugins')();
let $m = require('load-metalsmith-plugins')();

gulp.task('symlink-src', () => {
	return gulp.src("./repos/*/docs/")
		.pipe($g.sym(repoToSrc, {force: true, relative: true}));
})

gulp.task('build', ['symlink-src'], done => {
	Metalsmith(__dirname)
		.metadata({
			host: "localhost:8000",
		})
		.use($m.metadata({
      sections: "sections.yaml",
    }))
		.use(addProject)
		.use($m.sass({
			outputStyle: "expanded",
			includePaths: [ "./node_modules", "./bower_components" ]
		}))
		.use(pickLayout)
		.use($m.markdown())
		.use($m.layouts({
			engine: "handlebars",
			partials: "partials",
			helpers: {
				equal: function(lvalue, rvalue, options) {
					if (arguments.length < 3)
						throw new Error("Handlebars Helper equal needs 2 parameters");
					if( lvalue!=rvalue ) {
						return options.inverse(this);
					} else {
						return options.fn(this);
					}
				}
			}
		}))
		.build(done);
});

gulp.task('serve', () => {
	gulp.src('./build')
    .pipe($g.webserver({
      livereload: true,
      open: "1.html",
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

function pickLayout(files, metalsmith, done) {
	_.each(files, f => {
		switch(f.category) {
			case "Endpoints":
			case "Errors":
			case "Resources":
				f.layout = "reference.handlebars";
				break;
			case "Guides":
			case "Tutorials":
				f.layout = "learn.handlebars";
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

// x converts markdown to html
// rewrites links
// x renders header
// renders sidebar
//  
// x pick layout based on category
// pick sidebar based on project
// x pick project based on path
// concats js
// x sass process
// conact/fingerprint assets
//

