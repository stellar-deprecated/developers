/**
 * For multi-language code samples, show only one language add a time and add
 * a language switching UI.
 */
(function($) {
  'use strict';

  var MATCH_LANGUAGE = /(?:lang|language)-([a-zA-Z]+)/;
  var LANGUAGE_NAMES = {
    sh: 'Bash',
    js: 'JavaScript',
    json: 'JSON',
    toml: 'TOML'
  };
  var DEFAULT_LANGUAGE = 'js';
  var STORAGE_KEY = 'code-examples';

  var codeExamples = {
    getLanguage: function() {
      if (!this._language && window.localStorage) {
        try {
          var data = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
          this._language = data.language;
        }
        catch (error) {}
      }
      if (!this._language) {
        this._language = DEFAULT_LANGUAGE;
      }
      return this._language;
    },
    setLanguage: function(language) {
      this._language = language;
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          language: language
        }));
      }
      $(document).trigger('change-code-example-language', language);
    }
  };

  function clickedLanguageButton(event) {
    var language = $(event.target).attr('data-language');
    if (language) {
      codeExamples.setLanguage(language);
    }
  }

  function languageForElement(element) {
    var className = $(element).children('code').attr('class');
    var match = className && className.match(MATCH_LANGUAGE);
    return match && match[1];
  }

  function Switcher (element) {
    this.element = element;
    this.examples = this.findExamples();
    this.addUi();
    $(document).on('change-code-example-language', function(event, language) {
      this.setLanguage(language);
    }.bind(this));
    this.setLanguage(codeExamples.getLanguage());
  }

  Switcher.prototype.findExamples = function() {
    var examples = {};
    var self = this;
    $('pre', this.element).each(function(index, pre) {
      var language = languageForElement(pre);
      if (language) {
        examples[language] = pre;
        self._baseLanguage = self._baseLanguage || language;
      }
    });
    return examples;
  };

  Switcher.prototype.addUi = function() {
    this.createUi().prependTo(this.element);
  };

  Switcher.prototype.createUi = function() {
    var title = $(this.element).attr('name');
    var container = $('<div class="language-switcher"></div>');
    container.append($('<span class="code-example-title"></span>').text(title));
    for (var language in this.examples) {
      var languageName = LANGUAGE_NAMES[language] || capitalize(language);
      var button = $('<button class="language-switcher--setter"></button>')
        .text(languageName)
        .attr('data-language', language)
        .on('click', clickedLanguageButton);
      container.append(button);
    }
    return container;
  };

  Switcher.prototype.setLanguage = function(value) {
    if (!(value in this.examples)) {
      // find the first available language and show it
      value = this._baseLanguage;
    }

    var scrollTop = document.body.scrollTop;
    var bounds = this.element.getBoundingClientRect();

    for (var language in this.examples) {
      var visible = language === value;
      $(this.examples[language]).css('display', visible ? '' : 'none');
      $('.language-switcher--setter[data-language="' + language + '"]',
        this.element)
        .toggleClass('selected', visible);
    }

    if (bounds.top < 0) {
      var newBounds = this.element.getBoundingClientRect();
      window.scrollTo(
        document.body.scrollLeft,
        scrollTop + (newBounds.height - bounds.height));
    }
  };

  function capitalize(text) {
    return text.split(' ').map(function(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  // ...and go!
  $('code-example').each(function(index, element) {
    new Switcher(element);
  });

})(jQuery);
