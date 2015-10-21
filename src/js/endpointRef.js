// Skip .ready so that there is less FOUC
// FOUC can be removed by moving the DOM manipulation into the post processing

// Build step
;(function() {
  'use strict';

  // init
  var $endpointDocs = $('.mainContent');
  var $endpointBar = $('.js-endpointRef-exampleBar');
  if ($endpointDocs.length !== 1 && $endpointBar.length !== 1) {
    $endpointBar.remove();
    return;
  }

  // language list is in order. first item is the default
  // This does not include the 'default' language which may exist in the store
  // Will be directly inserted into a classname, so if there is ever a language
  // with special characters, code below to escape it will need to be written
  var languageList = ['curl', 'JavaScript', 'Go', 'Ruby'];
  var languagesWithExamples = {}; // will contain case sensitive name of languages that have content
  var exampleStore = { // contains string representation of html
    request: {},
    response: {},
  };

  // scrape relevant content and put it into our exampleStore
  var processExample = function(id, language, type) {
    var $id = $(id);
    var $example = $id.nextUntil('h3,h2');
    if ($example.length !== 0) {
      languagesWithExamples[language] = true;
      exampleStore[type][language] = $('<div>').append($example.clone()).html();
    }

    $id.remove();
    $example.remove();
  }
  languageList.forEach(function(language) {
    var languageId = language.toLowerCase();
    processExample('#' + languageId + '-example-request', language, 'request');
    processExample('#' + languageId + '-example-response', language, 'response');
  });
  processExample('#example-request', '_default', 'request');
  processExample('#example-response', '_default', 'response');

  // initial render: since we don't have a library to manage our clicks,
  // this initial render only runs once so that the click handlers don't get
  // destroyed. This is also so that we don't have to re-initialize the content
  // that may be expensive to load (codemirror)
  var $menu = $endpointBar.find('.js-endpointRef-menu');
  var $exampleRequest = $endpointBar.find('.js-endpointRef-exampleRequest');
  var $exampleResponse = $endpointBar.find('.js-endpointRef-exampleResponse');

  var examplesExist = false;

  if (languageList.length === 0) {
    $endpointBar.remove();
    return $.html();
  }

  var firstLanguage = true;
  languageList.forEach(function(language) {
    if (language in languagesWithExamples) {
      examplesExist = true;
      var activeClass = (firstLanguage) ? ' is-active' : '';
      $menu.append('<button class="s-button s-button__min s-buttonList__item js-endpointRef-menu__item js-endpointRef-menuLang--' + language + activeClass + '" endpoint-ref-lang="' + language + '">' + language + '</button>');

      $exampleRequest.append('<div class="js-endpointRef-lang js-endpointRef-lang--' + language + '"></div>');
      $exampleResponse.append('<div class="js-endpointRef-lang js-endpointRef-lang--' + language + '"></div>');

      var $currentExampleReqBox = $('.js-endpointRef-exampleRequest .js-endpointRef-lang--' + language);
      var $currentExampleResBox = $('.js-endpointRef-exampleResponse .js-endpointRef-lang--' + language);

      if (language in exampleStore.request) {
        $currentExampleReqBox.html(exampleStore.request[language]);
      } else if ('_default' in exampleStore.request) {
        $currentExampleReqBox.html(exampleStore.request['_default']);
      }

      if (language in exampleStore.response) {
        $currentExampleResBox.html(exampleStore.response[language]);
      } else if ('_default' in exampleStore.response) {
        $currentExampleResBox.html(exampleStore.response['_default']);
      }

      // Default to only showing the first language available
      if (firstLanguage) {
        firstLanguage = false;
      } else {
        $currentExampleReqBox.css('display', 'none');
        $currentExampleResBox.css('display', 'none');
      }
    }
  });

  if (!examplesExist) {
    $endpointBar.remove();
  } else {
    $endpointBar.addClass('is-available');
  }
})()

// Runtime controller for the endpointRef module (to show examples in a sidebar)
;(function endpointRef() {
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
