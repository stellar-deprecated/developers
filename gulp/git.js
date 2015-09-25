import {exec} from "child_process";
import _ from "lodash";
import fs from "fs";
import path from "path";
import Promise from 'bluebird';
import gulp from 'gulp';

let repos = require("../repos");
let execAsync = Promise.promisify(exec);

gulp.task("git:clone", done => {
  let clones = _.map(repos, (data, name) => {
    let dest = path.join("repos", name);
    if (fs.existsSync(dest)) {
      console.log(`info: ${dest} already cloned`);
      return Promise.resolve();
    }

    return execAsync(`git clone ${data.githubURL} ${dest}`)
      .then(() => console.log(`info: cloned ${dest}`));
  });

  Promise.all(clones).then(
    () => done(),
    err => done(err)
  );
});
