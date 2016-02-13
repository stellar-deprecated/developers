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
      <li class="pageNavList__subList collapsibleListSet js-collapsibleListSet">
        <span class="pageNavList__title collapsibleListSet__label js-collapsibleListSet__label">${title}</span>
        <ul class="collapsibleListSet__list js-collapsibleListSet__list is-collapsed">
          ${options.fn(this)}
        </ul>
      </li>
    `;
  },

  // clientData is documented in the README.md
  frontmatterClientDataScript(options) {
    // If clientData is not specified, an empty object will appear at window.clientData.
    // This makes it easier since scripts can always know clientData exists.
    let clientDataJson = '{}';
    if (typeof options.data.root.clientData === 'object') {
      clientDataJson = JSON.stringify(options.data.root.clientData);
    }
    if (typeof options.data.root.clientData === 'string') {
      console.log(`warn: clientData in "${options.data.root.title}" must be formatted as an object`);
    }
    return `<script>window.clientData = ${clientDataJson};</script>`;
  },
}


module.exports.setFileList = function(files) {
  allFiles = files
}
