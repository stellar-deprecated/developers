/**
 * Generate JSON summaries of symbols from Stellar SDKs for use when syntax
 * highlighting code samples in documentation.
 *
 * TODO: other SDKs besides JS
 * TODO: does this belong as a CLI script in each SDK repo instead?
 * TODO: is there a JS API for JSDoc we can/should use instead?
 */

import child_process from 'child_process';
import cheerio from 'cheerio';

const DOCUMENTATION_URL = 'https://stellar.github.io/js-stellar-sdk/';

export function javascriptSymbols(callback) {
  let output = '';
  let error = '';

  // npm install in js-stellar-sdk
  child_process.spawnSync('yarn', ['install'], {cwd: './repos/js-stellar-sdk/'});

  const jsDoc = child_process.spawn(
    // Executed in './repos/js-stellar-sdk/'
    './node_modules/.bin/jsdoc',
    [
      '-c', '.jsdoc.json',
      '--explain' // output doclet JSON instead of templated web site
    ],
    {
      cwd: './repos/js-stellar-sdk/'
    });

  jsDoc.stdout.on('data', data => output += data);
  jsDoc.stderr.on('data', data => error += data);
  jsDoc.on('exit', code => {
    if (code === 0) {
      const doc = parseDoclets(output);
      callback(null, doc.names);
    }
    else {
      callback(error, null);
    }
  });
}

function parseDoclets (rawString) {
  const doclets = JSON.parse(rawString);

  const parsed = doclets.reduce((result, doclet) => {
    if (
      doclet.name &&
      !doclet.name.startsWith('_') &&
      doclet.description &&
      !(result.longnames[doclet.longname] && result.longnames[doclet.longname].description) &&
      !doclet.undocumented) {

      const finalDoclet = simplifiedDoclet(doclet);
      result.longnames[doclet.longname] = finalDoclet;
      if (!result.names[doclet.name]) {
        result.names[doclet.name] = [];
      }
      result.names[doclet.name].push(finalDoclet);
    }
    return result;
  }, {
    longnames: {},
    names: {}
  });

  return parsed;
}

/**
 * Create a standardized, minimal doc object from a JSDoc doclet.
 * @param {JSDocDoclet} doclet
 * @return {{kind: String, name: String, longname: String, params: Array}}
 */
function simplifiedDoclet (doclet) {
  const result = {
    kind: doclet.kind,
    name: doclet.name,
    longName: doclet.longname,
    url: urlForSymbol(doclet.longname, DOCUMENTATION_URL),
    description: formatDescription(doclet.description, DOCUMENTATION_URL)
  };
  if (doclet.memberof) {
    result.memberOf = doclet.memberof;
  }
  // Params take up a lot of space & we don't use them, but may want them later.
  // if (doclet.params) {
  //   result.params = doclet.params;
  // }
  return result;
}

function formatDescription (text, baseUrl) {
  let formatted = convertLinksToHTML(text, baseUrl);
  const $ = cheerio.load(formatted);

  // remove example code
  $('.source').remove();

  // TODO: clip at a certain number of words or characters?

  return $.html();
}

// Find calls for links to other symbols in a description. Captures 1 is the
// target of the link.
const LINK_MATCHER = /\{\@link\s([^}]+)\}/g;

// Break up a target into the owner and member being targeted. The member
// includes the type specifier (e.g. '.') for all but instance members.
const TARGET_PARTS = /^(\w+)\#?(.*)$/;

function convertLinksToHTML (text, baseUrl) {
  return text.replace(LINK_MATCHER, (match, target) => {
    const url = urlForSymbol(target, baseUrl);
    return `<a href="${url}">${target}</a>`;
  });
}

function urlForSymbol (symbol, baseUrl) {
  const [_, owner, member] = symbol.match(TARGET_PARTS);
  return `${baseUrl}${owner}.html#${member}`;
}
