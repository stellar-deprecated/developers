import _ from 'lodash';
import arrayToTable from 'array-to-table';
import axios from "axios";
import gulp from 'gulp';
import replace from 'gulp-replace';

gulp.task("src:generate-nodes-page", () => {
  return axios.get('https://dashboard.stellar.org/api/nodes')
    .then(response => {
      let table = _.map(response.data, node => {
        let row = {};

        row["Name"] = node.name;
        row["Host"] = `\`${node.host}:${node.port}\``;
        row["Public Key"] = `\`${node.publicKey}\``;

        if (node.uptime_24h === undefined) {
          row["Uptime 24h"] = "n/d";
        } else {
          row["Uptime 24h"] = `${node.uptime_24h}%`;
        }

        if (node.uptime_30d === undefined) {
          row["Uptime 30d"] = "n/d";
        } else {
          row["Uptime 30d"] = `${node.uptime_30d}%`;
        }

        return row;
      });
      return _.sortBy(table, r => r.Name);
    })
    .then(table => {
      return gulp.src('./templates/nodes.md')
        .pipe(replace('[[date]]', new Date().toLocaleDateString("en-US")))
        .pipe(replace('[[table]]', arrayToTable(table)))
        // This is run after `src:symlink-repos` task so sources are in `src` folder.
        .pipe(gulp.dest('./src/guides'));
    });
});
