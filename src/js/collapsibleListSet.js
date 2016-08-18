// collapsibleListSet is a container that wraps two elements: label and list.
// The label toggles the collapsed state of the list.

// This also scans for any children that is the currentItem
// ('.js-collapsibleListSet__list li.is-currentItem'). If any of these items
// are present, then the collapsibleListSet's classes will be all removed.
// The reason is for this is due to limitations on how we can style multi level
// nested items that take up an absolute space relative to an item that is not
// the collapsibleListSet. (see `.pageNavList__item.is-currentItem` and
// `.pageNavListBounder`).

// A collapsibleListSet's classes can also be removed if it is a child of another
// collapsibleListSet.

(function() {
  $('.js-collapsibleListSet').each(function(index, container) {
    var $container = $(container);
    var $label = $container.find('> .js-collapsibleListSet__label');
    var $list = $container.find('> .js-collapsibleListSet__list');

    if ($container.parents('.js-collapsibleListSet, .js-collapsibleListSet--nullified').length > 0
        || $list.find('.is-currentItem').length > 0) {
      $container.removeClass('collapsibleListSet js-collapsibleListSet');
      $container.addClass('js-collapsibleListSet--nullified');
      $container.find('> .js-collapsibleListSet__label').removeClass('collapsibleListSet__label is-collapsed js-collapsibleListSet__label');
      $container.find('> .js-collapsibleListSet__list').removeClass('collapsibleListSet__list is-collapsed js-collapsibleListSet__list');
      return;
    }

    $label.click(function() {
      // Set up the element to transition to a set max-height. This is necessary
      // because it is not possible to use pure css to animate height.
      $list.css('max-height', $list[0].scrollHeight);
      $([$label, $list]).toggleClass('is-collapsed');
    });
  });
})();