import _ from 'lodash';
import minimatch from "minimatch";

let allFiles = {};

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
    let options = _.last(args);
    let globs = args
      .slice(0, args.length - 1)
      .map(glob => new minimatch.Minimatch(glob));

    return _.chain(allFiles)
      .map((file, path) => path)
      .filter(path => _.some(globs, glob => glob.match(path)))
      .sortBy()
      .map(path => options.fn(
        // create a child context object for rendering
        _.extend({}, this, {path, file: allFiles[path]})))
      .join('')
      .value();
  },

  sidebarSubMenu(title, options) {
    let c = options.hash.collapsible == true;
    const listTag = options.hash.numbered ? 'ol' : 'ul';

    return `
      <li class="pageNavList__subList${(c) ? ' collapsibleListSet js-collapsibleListSet' : ''}">
        <span class="pageNavList__title${(c) ? ' collapsibleListSet__label js-collapsibleListSet__label' : ''}">${title}</span>
        <${listTag} class="collapsibleListSet__list${(c) ? ' js-collapsibleListSet__list is-collapsed' : ''}">
          ${options.fn(this)}
        </${listTag}>
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

  // If available, return the fingerprinted version of a path, otherwise just
  // return the path as-is.
  fingerprint (path) {
    return this.fingerprint && this.fingerprint[path] || path;
  }
};


module.exports.setFileList = function(files) {
  allFiles = files;
};
