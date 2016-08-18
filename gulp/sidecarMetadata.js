import _ from "lodash";
import minimatch from "minimatch";

export default function sidecarMetadata(allFiles, metalsmith, done) {
  _.each(allFiles, (f, p) => {
    if (!minimatch(p, '**/*.metadata')) {
      return;
    }

    delete f.contents;
    delete f.mode;
    delete f.stats;

    let mainPath = p.replace(/\.metadata$/, '');

    if (mainPath in allFiles) {
      allFiles[mainPath] = _.extend(allFiles[mainPath], f);
    }
    delete allFiles[p];
  });

  done();
}
