// This adds functionality to all headers inside s-read-md to have a # appear on
// hover so that it is easier to link to specific parts of the article
$('s-read-md h1, s-read-md h2, s-read-md h3, s-read-md h4, s-read-md h5, s-read-md h6').each(function(i, elem) {
  'use strict';
  if (elem.id !== '') {
    $(elem).prepend('<a class="anchorShortcut" href="#' + elem.id + '"></a>');
  }
});
