/* global Drop */

/**
 * Display footnotes as popovers.
 */
(function($) {
  'use strict';

  var SUPPORTS_TOUCH = 'createTouch' in document;

  function createFootnoteDropdown(footnoteLink) {
    var content = $(footnoteLink.getAttribute('href'));
    if (!content.length) return;

    var noteNode = document.createElement('s-read-md');
    $(noteNode)
      .append(content.clone().children())
      .find('.footnote-backref')
        .remove();

    return new Drop({
      target: footnoteLink.parentNode,
      position: 'bottom center',
      classes: 'drop-theme-arrows footnote-drop',
      openOn: SUPPORTS_TOUCH ? 'click' : 'hover',
      content: noteNode
    });
  }

  $('.footnote-ref a').each(function(index, element) {
    createFootnoteDropdown(element);
  });

})(jQuery);
