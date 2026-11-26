/* NestBudget router — hash routes, one render function per page. */
'use strict';

(function () {
  var NB = window.NB;
  var view = document.getElementById('view');

  var ROUTES = {
    '': NB.renderHome,
    'calculator': NB.renderCalculator,
    '503020': NB.render503020,
    'goals': NB.renderGoals,
    'debt': NB.renderDebt,
    'emergency': NB.renderEmergency,
    'examples': NB.renderExamples,
    'method': NB.renderMethod,
    'about': NB.renderAbout
  };

  function currentRoute() {
    var hash = window.location.hash || '#/';
    var route = hash.replace(/^#\/?/, '').split('?')[0].split('/')[0];
    return ROUTES[route] ? route : '';
  }

  function render() {
    var route = currentRoute();
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-route') === route);
    });
    ROUTES[route](view);
    window.scrollTo(0, 0);
    document.title = route === '' ? 'NestBudget — Household Budget Planner' :
      'NestBudget — ' + document.querySelector('h1').textContent;
  }

  window.addEventListener('hashchange', render);
  render();
})();
