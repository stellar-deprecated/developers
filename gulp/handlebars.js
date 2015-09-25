import path from 'path';
import _ from 'lodash';
import minimatch from "minimatch";

let allFiles = {}

module.exports.helpers = {
  equal(lvalue, rvalue, options) {
    if (arguments.length < 3)
      throw new Error("Handlebars Helper equal needs 2 parameters");
    if( lvalue!=rvalue ) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  },

 eachFile() {
    let args = Array.slice(arguments);
    let options = _.last(args)
    let globs = args.slice(0, args.length-1);

    let result = "";

    _.each(allFiles, (f,p) => {
      let matches = _.any(globs, g => minimatch(p,g));
      if (!matches) return

      let ctx = _.extend({}, this, {path: p, file: f})

      result += options.fn(ctx);
    });

    return result;
  },

  sidebarSubMenu(title, options) {
    return `
      <li class="pageNavList__subList">
        <span class="pageNavList__title">${title}</span>
        <ul>
          ${options.fn(this)}
        </ul>
      </li>
    `;
  },
}


module.exports.setFileList = function(files) {
  allFiles = files
}
