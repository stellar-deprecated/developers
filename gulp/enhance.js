import _ from "lodash";
import path from "path";

let repos = require("../repos.json");

// The enhance middleware populates a bunch of metadata fields on the files.
export default function enhance(files, metalsmith, done) {
	_.each(files, (f,p) => {
		addRepoInfo(f,p);
		addProject(f,p);
		addSection(f,p);
		addLayout(f,p);
		addDefaultTitles(f,p);
	})
	done();
}

function addRepoInfo(f, p) {
	let parts = p.split(path.sep);

	switch(parts[0]) {
		case "learn":
		case "reference":
		case "tools":
		case "beyond-code":
			f.repo = "docs";
			f.repoPath = "docs/" + parts.join("/");
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

	let repo = repos[f.repo]
	f.repoURL = repo.githubURL + "/blob/master/" + f.repoPath;
}


function addProject(f, p) {
	if (!f.repo) return;
	if (f.repo === "docs") return;

	f.project = f.repo;
}

function addSection(f, p) {
	if (path.extname(p) !== ".md") return;

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
}

function addLayout(f, p) {
	if ("section" in f) {
		f.layout = f.section + ".handlebars";
	}
}

function addDefaultTitles(f, p) {
	if ("title" in f) return;
	console.log(`warn: ${p} has no title`);
	f.title = path.basename(p);
}



