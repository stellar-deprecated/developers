/* global Drop */

(function($) {
  'use strict';

  var SUPPORTS_TOUCH = 'createTouch' in document;

  function loadSymbols() {
    return $.ajax({
      // FIXME: need to grab a base url from somewhere
      url: '/js/javascript-symbols.json',
      dataType: 'json'
    });
  }

  function setupStyles() {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = 'pre > code a[rel=documentation] { color: inherit; }';
    document.head.appendChild(style);
  }

  function replaceWithLink(element, symbol) {
    var link = document.createElement('a');
    link.appendChild(document.createTextNode(element.textContent));
    link.rel = 'documentation';
    link.href = symbol.url;
    link.target = '_blank';

    if (symbol.description) {
      var dropContent = document.createElement('div');
      var description = document.createElement('s-read-md');
      description.className = 'symbol-description';
      description.innerHTML = symbol.description;
      dropContent.appendChild(description);
      $(dropContent).find('a').each(function(index, link) {
        if (isOffsiteUrl(link.href)) {
          link.target = '_blank';
        }
      });

      var readMoreLink = document.createElement('a');
      readMoreLink.href = symbol.url;
      readMoreLink.target = '_blank';
      readMoreLink.textContent = 'Read Full Documentation';
      dropContent.appendChild(readMoreLink);

      new Drop({
        target: link,
        position: 'bottom center',
        classes: 'drop-theme-arrows api-reference-drop',
        openOn: SUPPORTS_TOUCH ? 'click' : 'hover',
        hoverOpenDelay: 1000,
        content: dropContent
      });
    }

    $(element).empty().append(link);
    return link;
  }

  function linkSymbols(element, symbols) {
    $('.cm-variable:contains("StellarSdk") + .cm-property', element).each(function(index, propertyElement) {
      var symbolName = $.trim(propertyElement.textContent);
      var candidates = symbols[symbolName];

      // TODO: handle >1 candidates?
      if (!candidates || candidates.length !== 1) return;

      var symbol = candidates[0];
      replaceWithLink(propertyElement, symbol);

      // this is a little messy, but we want to link the next one, too, e.g:
      // StellarSdk.Keypair.fromSeed <- link both `Keypair` and `fromSeed`
      var nextProperty = $(propertyElement).next('.cm-property')[0];
      if (!nextProperty) return;
      var nextName = $.trim(nextProperty.textContent);
      candidates = symbols[nextName];
      if (!candidates) return;

      var nextSymbol;
      for (var i = 0, len = candidates.length; i < len; i++) {
        if (candidates[i].memberOf === symbol.name) {
          nextSymbol = candidates[i];
          break;
        }
      }
      if (!nextSymbol) return;
      replaceWithLink(nextProperty, nextSymbol);
    });

    // This approach could potentially have a lot of false positives, but if we
    // keep example code nicely written, it should be workable.
    for (var name in symbols) {
      // TODO: can we make any good inferences that allow us to handle multiple
      // types with the same members, e.g. Keypair#sign vs. Transaction#sign
      if (symbols[name].length !== 1) continue;
      var symbol = symbols[name][0];
      $('.cm-property:contains("' + name + '")', element).each(function(index, propertyElement) {
        // don't re-link symbols we already found
        if (!propertyElement.children.length) {
          replaceWithLink(propertyElement, symbol);
        }
      });
    }
  }

  var URL_EXPRESSION = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>\[\]'"]+|\([^\s()<>\[\]'"]*\))+(?:\([^\s()<>\[\]'"]*\)|[^\s`!()\[\]{}:'".,<>?«»“”‘’]))/gi;

  function linkCommentUrls(element) {
    // if we highlighted anything, only set up links in comments
    if (element.children.length) {
      $('.cm-comment', element).each(function(index, comment) {
        autoLinkInElement(comment);
      });
    }
    else {
      var fragment = document.createDocumentFragment();
      var foundLinks = false;
      element.textContent.split('\n').forEach(function (line) {
        line += '\n';
        if (line[0] === '#' || line.slice(0, 2) === '//') {
          var links = createLinksFromText(line);
          fragment.appendChild(links);
          if (links.nodeType !== document.TEXT_NODE) {
            foundLinks = true;
          }
        }
        else {
          fragment.appendChild(document.createTextNode(line));
        }
      });
      if (foundLinks) {
        element.innerHTML = '';
        element.appendChild(fragment);
      }
    }
  }

  function autoLinkInElement(element) {
    // TODO: use a treewalker to just walk the text nodes so we don’t destroy
    // an existing element tree
    var links = createLinksFromText(element.textContent);
    if (links.nodeType !== document.TEXT_NODE) {
      element.innerHTML = '';
      element.appendChild(links);
    }
  }

  function createLinksFromText(text) {
    var segments = text.split(URL_EXPRESSION);
    var length = segments.length;
    if (length === 1) { return document.createTextNode(text); }

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < length; i += 2) {
      fragment.appendChild(document.createTextNode(segments[i]));
      var url = segments[i + 1];
      if (url) {
        var link = document.createElement('a');
        link.href = url;
        link.appendChild(document.createTextNode(url));
        if (isOffsiteUrl(url)) {
          link.target = '_blank';
        }
        fragment.appendChild(link);
      }
    }
    return fragment;
  }

  function isOffsiteUrl(url) {
    var hostname = url && url.match(/^(?:\w+:\/\/(?:\/?))?([^\/]+)/);
    return hostname && hostname[1] !== window.location.hostname;
  }

  $(function() {
    $('pre > code').each(function(index, element) {
      linkCommentUrls(element);
    });

    var highlightedCode = $('pre > code.language-js');
    if (!highlightedCode.length) return;

    loadSymbols().then(function(symbols) {
      setupStyles();
      highlightedCode.each(function(index, element) {
        linkSymbols(element, symbols);
      });
    });
  });

})(jQuery);
