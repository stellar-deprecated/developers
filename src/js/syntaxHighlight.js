// Usage:
//   syntaxHighlight($('code.block'));
//
// Parent will be adorned with some extra classes

window.syntaxHighlight = (function() {
  var languageMap = {
    'js': 'javascript',
    'javascript': 'javascript',
    'json': 'javascript',
    'node': 'javascript',
    'sh': 'shell',
    'shell': 'shell',
    'bash': 'shell',
    'java': 'text/x-java',
    'go': 'text/x-go',
    'toml': 'text/x-toml',
    'python': 'text/x-python'
  };

  var highlighter = function(code) {
    var $code = $(code);
    var $parent = $code.parent();

    // see if this is a valid candidate for highlighting (has class starting with lang- or language-)
    if (typeof $code.attr('class') === 'undefined') {
      return;
    }
    var classMatch = $code.attr('class').match(/(lang|language)-([a-zA-Z]+)/);

    if (classMatch !== null && classMatch.length == 3 && classMatch[2] in languageMap) {
      CodeMirror.runMode($code.text(), languageMap[classMatch[2]], $code[0]);
      $parent.addClass('cm-s-monokai CodeMirror codeBlock codeBlock--syntaxHighlight');
    } else {
      $parent.addClass('cm-s-monokai CodeMirror codeBlock codeBlock--plain');
    }
  };

  $('pre > code').each(function(k, code) {
    highlighter($(code));
  });

  return highlighter;
})();
