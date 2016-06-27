import gulp from 'gulp';
import path from 'path';
import Metalsmith from 'metalsmith';
import _ from 'lodash';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItFootnote from 'markdown-it-footnote';
import util from 'util';
import fs from 'fs';
import hbars from './gulp/handlebars';
import extract from "./gulp/extract";
import links from "./gulp/links";
import minimatch from "minimatch";
import safeSymlink from './gulp/safeSymlink';

let argv = require('minimist')(process.argv.slice(2));
let $g = require('gulp-load-plugins')();
let $m = require('load-metalsmith-plugins')();

// add the git related gulp tasks
import "./gulp/git";

gulp.task("default", ["build"]);

gulp.task('src:symlink-repos', ['git:clone'], () => {
  // symlink the landing pages/custom content from the docs repo for each section
  safeSymlink("../repos/docs/learn", "src/learn")
  safeSymlink("../repos/docs/reference", "src/reference")
  safeSymlink("../repos/docs/tools", "src/tools")
  safeSymlink("../repos/docs/beyond-code", "src/beyond-code")

  // link up other repo's docs folder into the src structure
  return gulp.src("./repos/*/docs/")
    .pipe($g.sym(repoToSrc, {force: true, relative: true}));
})

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

  let templateOptions = {
    engine: "handlebars",
    partials: "partials",
    helpers: hbars.helpers,
    preventIndent: true,
  };

  Metalsmith(__dirname)
    .metadata({ pathPrefix: argv.pathPrefix || "" })
    .use((f,m,d) => {
      hbars.setFileList(f);
      d();
    })
    .use(extract.examples)
    .use(require("./gulp/sidecarMetadata"))
    .use(require("./gulp/enhance"))
    .use($m.sass({
      outputStyle: "expanded",
      includePaths: [ "./node_modules", "./bower_components" ]
    }))
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
    }))
    .use($m.fingerprint({
      pattern: [
        "styles/index.css",
        "js/app.js",
      ]
    }))
    .use(renameReadme)
    .use($m.markdownit({
      html: true,
      linkify: true,
      typographer: true
    }).use(markdownItAnchor, {
      permalink: true,
      permalinkClass: 'anchorShortcut',
      permalinkSymbol: '',
      permalinkBefore: true
    }).use(markdownItFootnote))
    .use($m.inPlace(_.extend({}, templateOptions, {
      pattern: '*.handlebars'
    })))
    .use(renameHandlebars)
    .use($m.layouts(templateOptions))
    .use(links.rewrite)

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
    let newPath = path.basename(key, '.handlebars') + '.html'
    files[newPath] = files[key];
    delete files[key];
  })
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


// TODO:
//   live reload
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
