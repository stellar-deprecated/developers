import _ from "lodash";
import path from "path";
import minimatch from "minimatch";

let repos = require("../repos.json");

// The enhance middleware populates a bunch of metadata fields on the files.
export default function enhance(files, metalsmith, done) {
  _.each(files, (file, filePath) => {
    addSrcInfo(file, filePath, metalsmith);
    addRepoInfo(file, filePath, metalsmith);
    addProject(file, filePath, metalsmith);
    addFullTitle(file, filePath, metalsmith);
    addSection(file, filePath, metalsmith);
    addLayout(file, filePath, metalsmith);
    addDefaultTitles(file, filePath, metalsmith);
    addExamples(file, filePath, metalsmith);
    addSequenceInfo(file, filePath, metalsmith, files);
  });
  done();
}

function addSrcInfo(file, filePath) {
  file.srcPath = filePath;
}

function addRepoInfo(file, filePath) {
  let parts = filePath.split(path.sep);

  switch(parts[0]) {
    case "guides":
    case "reference":
    case "software":
    case "tools":
    case "beyond-code":
      file.repo = "docs";
      file.repoPath = filePath;
      break;
    default:
      // if parts[0] is the name of a repo, use it
      if (parts[0] in repos) {
        file.repo = parts[0];
        let newParts = parts.slice(0);
        newParts[0] = "docs";
        file.repoPath = newParts.join("/");
      } else {
        // no repo for this case
      }
      break;
  }

  if (!file.repo) return;

  let repo = repos[file.repo];
  file.repoURL = repo.githubURL;
  file.repoBlobURL = repo.githubURL + "/blob/master/" + file.repoPath;
}

function addProject(file, filePath) {
  if (!file.repo) return;
  if (file.repo === "docs") return;

  file.project = file.repo;
  file.projectTitle = repos[file.repo].projectTitle;
}

function addFullTitle(file, filePath) {
  let titleSuffix = ' | Stellar Developers';

  if (!file.projectTitle || file.repo === 'docs') {
    file.fullTitle = file.title + titleSuffix;
    return;
  }

  file.fullTitle = file.title + ' - ' + file.projectTitle + titleSuffix;
}

function addSection(file, filePath) {
  if (path.extname(filePath) !== ".md") return;
  if (file.section) return;

  let parts = filePath.split(path.sep);
  switch(parts[0]) {
    case "guides":
    case "reference":
    case "software":
    case "tools":
      file.section = parts[0];
      break;
    default:
      // if we're dealing with a document inside a project's /docs folder, don't assign a layout
      if (parts.length == 2) {
        return;
      }
      // if not one of the above cases, then we are dealing with a project-specific
      // file (i.e. js-stellar-sdk).  In this case, we determine layout
      // based upon the nesting undernearth the project name.
      file.section = parts[1];
      break;
  }
}

function addLayout(file, filePath) {
  if ("section" in file) {
    file.layout = file.section + ".handlebars";
  }
}

function addDefaultTitles(file, filePath) {
  if (minimatch(filePath, "**/!(*.md)")) return;
  if ("title" in file) return;

  console.log(`warn: ${filePath} has no title`);
  file.title = path.basename(filePath);
}

function addExamples(f, p, metalsmith) {
  if(!minimatch(p, "go/services/horizon/reference/*.*")) return;
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

