// Skip .ready so that there is less FOUC
// FOUC can be removed by moving the DOM manipulation into the post processing

// endpointRef: endpoint page reference example sidebar
// only one can exist per page
(function endpointRef() {
  "use strict";
  // init
  var $endpointBar = $('.js-endpointRef-exampleBar');
  if ($endpointBar.length === 1) {
    // state definition
    var state = {
      language: $endpointBar.find('.js-endpointRef-menu .is-active').attr('endpoint-ref-lang')
    };

    // get initial state
    var storedItem = localStorage.getItem('developers.endpointRef.language');
    if (storedItem !== null && $endpointBar.find('.js-endpointRef-menu [endpoint-ref-lang=' + storedItem + ']').length == 1) {
      state.language = storedItem;
    }

    // render function. directly mutates the DOM already present in HTML
    var render = function() {
      $endpointBar.find('.js-endpointRef-menu').children().removeClass('is-active');
      $endpointBar.find('.js-endpointRef-menu .js-endpointRef-menuLang--' + state.language).addClass('is-active');
      $endpointBar.find('.js-endpointRef-lang').hide();
      $endpointBar.find('.js-endpointRef-lang--' + state.language).show();
    }
    // runtime render for the first time
    render();

    // component "mounted". now attach click handler to tab menu
    $endpointBar.find('.js-endpointRef-menu__item').on('click', function(el) {
      state.language = el.target.innerHTML;
      // component will update. save to localstorage the current param
      localStorage.setItem('developers.endpointRef.language', state.language);
      render();
    })
  }
})();
