import url from 'url'
import path from 'path'
import cheerio from 'cheerio';
import minimatch from 'minimatch';
import _ from 'lodash';

module.exports.rewrite = function(files, metalsmith, done) {
  _.each(files, (f,p) => {
    if (!minimatch(p, "**/*.html")) return;

    let $ = cheerio.load(f.contents);

    
    $('[link-process-md] a').each(function(i, elem) {
      //re-write relative .md links to .html
      mdToHtml($, elem, f, p);
      rootRelativeToGithub($, elem, f, p);
    });

    f.contents = $.html();
  });


  // link re-targeting
  // TODO: protocol relative links are left alone
  // TODO: links to the devportal prefix are rewritten to the rendering's prefix (i.e. host/path prefix are replaced)
  // TODO: root relative links are rewritten using the documents  root.
  // TODO: relative links are maintainted
  // TODO: If relative or root-relative, re
  // 
  done();
}

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

