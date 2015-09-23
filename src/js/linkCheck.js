;(function() {
  var linkcheck = function() {
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      if (links[i].href.match(/\/\#check$/) !== null) {
        links[i].className += ' linkCheck-emptyLink';
      }
    }
  };
  linkcheck();
})();
