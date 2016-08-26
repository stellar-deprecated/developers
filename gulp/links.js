import url from 'url';
import cheerio from 'cheerio';
import minimatch from 'minimatch';
import _ from 'lodash';

module.exports.rewrite = function(files, metalsmith, done) {
  const pathPrefix = metalsmith.metadata().pathPrefix || '';

  _.each(files, (f,p) => {
    if (!minimatch(p, "**/*.html")) return;

    let $ = cheerio.load(f.contents);


    $('[link-process-md] a').each(function(i, elem) {
      //re-write relative .md links to .html
      mdToHtml($, elem, f, p);
      rootRelativeToGithub($, elem, f, p);
      devportalToRelative($, elem, f, p, pathPrefix);
    });

    f.contents = $.html();
  });


  // link re-targeting
  // TODO: protocol relative links are left alone
  // TODO: root relative links are rewritten using the documents  root.
  // TODO: relative links are maintainted
  // TODO: If relative or root-relative, re
  //
  done();
};

// All .md links that are relative should point to the rendered output
function mdToHtml($, elem) {
  let href = $(elem).attr('href');
  if (!href) return;

  let u = url.parse(href);
  if(!u.pathname) return;

  var isMarkdown = u.pathname.match(/\.md$/) !== null;
  var isRelative = u.pathname.charAt(0) !== '/';

  if (!(isMarkdown && isRelative)) return;

  u.pathname = u.pathname.replace(/\.md$/, ".html");
  $(elem).attr('href', url.format(u));
}

// All root-relative links in content should link to github in the rendered output.
function rootRelativeToGithub($, elem, f, p) {
  let href = $(elem).attr('href');
  if (!href) return;
  if (!f.repoURL) return;

  var isRootRelative = href.charAt(0) === '/';
  if (!isRootRelative) return;

  $(elem).attr('href', f.repoURL + "/blob/master" + href);
}

// Identifies a URL for a dev portal page and matches a group for the path
const DEVPORTAL_URL =
  /^http(?:s)?:\/\/(?:www\.)?stellar.org\/developers\/?(.*)$/;

/**
 * Convert links to dev portal pages (used when linking to a doc whose
 * canonical version lives in another repo, e.g. a Horizon reference page
 * linking to a Stellar-Core reference page) to be relative.
 * e.g. "https://stellar.org/developers/whatever" -> "/whatever"
 * @param {CheerioDocument} $
 * @param {HTMLAnchorElement} element
 * @param {MetalsmithFile} file
 * @param {String} pathname
 * @param {String} pathPrefix
 */
function devportalToRelative($, element, file, pathname, pathPrefix) {
  let href = $(element).attr('href');
  const urlMatch = DEVPORTAL_URL.exec(href);

  if (urlMatch) {
    const urlPath = urlMatch[1];
    $(element).attr('href', `${pathPrefix}/${urlPath}`);
  }
}
