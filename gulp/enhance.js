import _ from "lodash";
import path from "path";
import minimatch from "minimatch";

let repos = require("../repos.json");

// The enhance middleware populates a bunch of metadata fields on the files.
export default function enhance(files, metalsmith, done) {
  _.each(files, (f, p) => {
    addSrcInfo(f, p, metalsmith);
    addRepoInfo(f, p, metalsmith);
    addProject(f, p, metalsmith);
    addFullTitle(f, p, metalsmith);
    addSection(f, p, metalsmith);
    addLayout(f, p, metalsmith);
    addDefaultTitles(f, p, metalsmith);
    addExamples(f, p, metalsmith);
    addSequenceInfo(f, p, metalsmith, files);
  });
  done();
}

function addSrcInfo(f, p) {
  f.srcPath = p;
}

function addRepoInfo(f, p) {
  let parts = p.split(path.sep);

  switch(parts[0]) {
    case "guides":
    case "reference":
    case "software":
    case "tools":
    case "beyond-code":
      f.repo = "docs";
      f.repoPath = p;
      break;
    default:
      // if parts[0] is the name of a repo, use it
      if (parts[0] in repos) {
        f.repo = parts[0];
        let newParts = parts.slice(0);
        newParts[0] = "docs";
        f.repoPath = newParts.join("/");
      } else {
        // no repo for this case
      }
      break;
  }

  if (!f.repo) return;

  let repo = repos[f.repo];
  f.repoURL = repo.githubURL;
  f.repoBlobURL = repo.githubURL + "/blob/master/" + f.repoPath;
}

function addProject(f, p) {
  if (!f.repo) return;
  if (f.repo === "docs") return;

  f.project = f.repo;
  f.projectTitle = repos[f.repo].projectTitle;
}

function addFullTitle(f, p) {
  let titleSuffix = ' | Stellar Developers';

  if (!f.projectTitle || f.repo === 'docs') {
    f.fullTitle = f.title + titleSuffix;
    return;
  }

  f.fullTitle = f.title + ' - ' + f.projectTitle + titleSuffix;
}

function addSection(f, p) {
  if (path.extname(p) !== ".md") return;
  if (f.section) return;

  let parts = p.split(path.sep);
  switch(parts[0]) {
    case "guides":
    case "reference":
    case "software":
    case "tools":
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
}

function addLayout(f, p) {
  if ("section" in f) {
    f.layout = f.section + ".handlebars";
  }
}

function addDefaultTitles(f, p) {
  if (minimatch(p, "**/!(*.md)")) return;
  if ("title" in f) return;

  console.log(`warn: ${p} has no title`);
  f.title = path.basename(p);
}

function addExamples(f, p, metalsmith) {
  if(!minimatch(p, "horizon/reference/*.*")) return;
  let examples = metalsmith.metadata()._examples;
  let ext = path.extname(p);
  let endpoint = path.basename(p).slice(0,-ext.length);

  if(!(endpoint in examples)) return;

  f.examples = examples[endpoint];
}

/**
 * Replace `sequence` objects in file metadata with metadata about the
 * referenced sequence files. Sequence is used to describe navigation through a
 * multi-step guide. In the file metadata, you might have:
 *
 *  sequence:
 *    previous: first-step.md
 *    next: third-step.md
 *
 * This method will update the sequence property to replace the referenced
 * file path with the metadata of the given file, plus a URL to link to:
 *
 *  {sequnce: {
 *    previous: {title: "Step 1", linkPath: "./first-step.html", ...}
 *    next: {title: "Step 3", linkPath: "./third-step.html", ...}
 *  }}
 *
 * @param {MetalsmithFile} file File metadata object from Metalsmith
 * @param {String} filePath Path of the file
 * @param {Metalsmith} metalsmith
 * @param {Object} allFiles Metalsmith file collection object
 * @returns
 */
function addSequenceInfo(file, filePath, metalsmith, allFiles) {
  const sequence = file.sequence;
  if (!sequence) return;

  if (sequence.previous) {
    sequence.previous = fileLinkInfo(sequence.previous, filePath, allFiles);
  }
  if (sequence.next) {
    sequence.next = fileLinkInfo(sequence.next, filePath, allFiles);
  }
}

/**
 * Get an object with a relative URL and title for the given file, as well as
 * any existing metadata for that file.
 * @private
 * @param {String} relativePath The relative path to the file
 * @param {String} fromPath The path that `relativePath` is relative to
 * @param {Object} allFiles A metalsmith file collection to get metadata from
 * @returns {{title: String, linkPath: String}}
 */
function fileLinkInfo(relativePath, fromPath, allFiles) {
  const filePath = path.join(path.dirname(fromPath), relativePath);
  const linkPath = filePath
    .replace(/(^|\/)readme\.md$/, 'index.html')
    .replace(/\.md$/, '.html');
  return Object.assign({
    // this is just a fallback if a file doesn't have an explicit title set
    title: relativePath.replace(/\.md$/, ''),
    linkPath: linkPath
  }, allFiles[filePath]);
}

