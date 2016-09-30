import gulp from 'gulp';
import path from 'path';
import Metalsmith from 'metalsmith';
import _ from 'lodash';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItImplicitFigures from 'markdown-it-implicit-figures';
import markdownItFootnote from 'markdown-it-footnote';
import hbars from './gulp/handlebars';
import extract from "./gulp/extract";
import links from "./gulp/links";
import minimatch from "minimatch";
import safeSymlink from './gulp/safeSymlink';

let argv = require('minimist')(process.argv.slice(2));
let $g = require('gulp-load-plugins')();
let $m = require('load-metalsmith-plugins')();

if (argv.pathPrefix && argv.pathPrefix[0] !== '/') {
  throw new Error('The --pathPrefix argument must start with a "/"');
}
const PATH_PREFIX = argv.pathPrefix || '';

// add the git related gulp tasks
import "./gulp/git";

gulp.task("default", ["build"]);

gulp.task('src:symlink-repos', ['git:clone'], () => {
  // symlink the landing pages/custom content from the docs repo for each section
  safeSymlink("../repos/docs/guides", "src/guides");
  safeSymlink("../repos/docs/reference", "src/reference");
  safeSymlink("../repos/docs/software", "src/software");
  safeSymlink("../repos/docs/tools", "src/tools");

  // link up other repo's docs folder into the src structure
  return gulp.src("./repos/*/docs/")
    .pipe($g.sym(repoToSrc, {force: true, relative: true}));
});

gulp.task('js:copy-vendor', function() {
  return gulp.src([
    // TODO: optimize and only load which ones are necessary
    './bower_components/jquery/dist/jquery.min.js',
    './bower_components/codemirror/lib/codemirror.js',
    './bower_components/codemirror/addon/runmode/runmode.js',
    './bower_components/codemirror/mode/javascript/javascript.js',
    './bower_components/codemirror/mode/shell/shell.js',
    './bower_components/codemirror/mode/clike/clike.js',
    './bower_components/codemirror/mode/go/go.js',
    './bower_components/stellar-sdk/stellar-sdk.min.js',
  ])
    .pipe($g.concat('vendor.js'))
    .pipe(gulp.dest('./src/js'));
});

gulp.task('build', ['src:symlink-repos', "js:copy-vendor"], done => {
  build({incremental: !!argv.incremental}, done);
});

gulp.task('serve', () => {
  gulp.src('./build')
    .pipe($g.webserver({
      livereload: true,
      open: "index.html",
    }));
});

gulp.task('watch', done => {
  gulp.watch('src/**/*', (event) => {
    build({incremental: true}, function() {});
  });
});

function repoToSrc(file) {
  let project = file.relative.split(path.sep)[0];
  return path.join("src", project);
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

function renameHandlebars (files, metalsmith, done) {
  let toReplace = _(files).keys().pick(key => minimatch(key, '*.handlebars')).value();
  _.each(toReplace, key => {
    let newPath = path.basename(key, '.handlebars') + '.html';
    files[newPath] = files[key];
    delete files[key];
  });
  done();
}

function build({clean = false, incremental = false, debug = !!argv.debug}, done) {

  let templateOptions = {
    engine: "handlebars",
    partials: "partials",
    helpers: hbars.helpers,
    preventIndent: true,
  };

  const sassOptions = {
    outputStyle: "expanded",
    includePaths: [ "./node_modules", "./bower_components" ]
  };
  if (debug) {
    Object.assign(sassOptions, {
      sourceMap: true,
      sourceMapContents: true,
      sourceMapEmbed: true
    });
  }

  const pipeline = Metalsmith(__dirname)
    .clean(!incremental)
    .metadata({ pathPrefix: PATH_PREFIX })
    .use(extract.examples)
    .use(require("./gulp/sidecarMetadata"))
    .use(require("./gulp/enhance"))
    .use($m.sass(sassOptions))
    .use($m.autoprefixer({ }))
    .use($m.concat({
      files: [
        "js/vendor.js",
        "js/syntaxHighlight.js",
        "js/codeExamples.js",
        "js/endpointRef.js",
        "js/friendbot4.js",
        "js/collapsibleListSet.js",
        "js/linkCheck.js",
      ],
      output: "js/app.js",
    }));

  if (!incremental) {
    // fingerprinting can only be done for non-incremental builds, otherwise
    // we'd need to rebuild every file that references the fingerprinted assets
    pipeline.use($m.fingerprint({
      pattern: [
        "styles/index.css",
        "js/app.js",
      ]
    }));
  }

  pipeline
    .use(renameReadme)
    .use((files, metalsmith, done) => {
      // we both need to copy the file list (so it doesn't get truncated if we
      // limit to incremental building in the next step) and do the renaming of
      // .md -> .html (again in case we limit to incremental building)
      const renamedFiles = _.mapKeys(
        files, (file, name) => name.replace(/\.md$/, '.html'));
      hbars.setFileList(renamedFiles);
      done();
    })
    .use($m.changed({
      forcePattern: '**/index*.css'
    }))
    .use(require("./gulp/math-formula.js"))
    .use(
      $m.markdownit({
        html: true,
        linkify: true,
        typographer: true
      })
      .use(markdownItAnchor, {
        permalink: true,
        permalinkClass: 'anchorShortcut',
        permalinkSymbol: '',
        permalinkBefore: true
      })
      .use(markdownItFootnote)
      .use(markdownItImplicitFigures))
    .use($m.inPlace(_.extend({}, templateOptions, {
      pattern: '*.handlebars'
    })))
    .use(renameHandlebars)
    .use($m.layouts(templateOptions))
    .use(links.rewrite)
    .build(done);
}


// TODO:
//   rewrite link engine
//   example system
//   concat vendor.js
//   concat app.js
//   fingerprint assets
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
