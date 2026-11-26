/* NestBudget charts — hand-rolled SVG donut and bar builders. No libraries,
   no images: every chart is drawn from the numbers on the page. */
'use strict';

var NB = window.NB || {};
window.NB = NB;

NB.svgEl = function (tag, attrs) {
  var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
  return el;
};

/* Donut from [{label, amount, color}]. size in px; the center shows a big
   figure and a caption. Returns an SVG element. */
NB.donut = function (slices, size, centerValue, centerLabel) {
  var total = slices.reduce(function (s, x) { return s + Math.max(0, x.amount); }, 0);
  var svg = NB.svgEl('svg', {
    viewBox: '0 0 200 200', width: size, height: size,
    role: 'img', 'aria-label': 'Spending breakdown chart'
  });
  var cx = 100, cy = 100, r = 78, thick = 30;
  var start = -Math.PI / 2;
  if (total <= 0) {
    svg.appendChild(NB.svgEl('circle', { cx: cx, cy: cy, r: r - thick / 2, fill: 'none', stroke: '#e7ddc8', 'stroke-width': thick }));
  } else {
    slices.forEach(function (s) {
      var frac = Math.max(0, s.amount) / total;
      if (frac <= 0) return;
      var end = start + frac * Math.PI * 2;
      var large = (end - start) > Math.PI ? 1 : 0;
      var x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      var x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      var path;
      if (frac >= 0.999) {
        path = NB.svgEl('circle', { cx: cx, cy: cy, r: r - thick / 2, fill: 'none', stroke: s.color, 'stroke-width': thick });
      } else {
        path = NB.svgEl('path', {
          d: 'M ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2),
          fill: 'none', stroke: s.color, 'stroke-width': thick
        });
      }
      svg.appendChild(path);
      start = end;
    });
  }
  var value = NB.svgEl('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', 'font-size': '21', 'font-weight': '800', fill: '#143d2f' });
  value.textContent = centerValue;
  var label = NB.svgEl('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', 'font-size': '11', fill: '#4c5a53' });
  label.textContent = centerLabel;
  svg.appendChild(value);
  svg.appendChild(label);
  return svg;
};

/* Horizontal stacked bar from [{label, amount, color}]; one row, full width. */
NB.stackedBar = function (slices, height) {
  var total = slices.reduce(function (s, x) { return s + Math.max(0, x.amount); }, 0);
  var svg = NB.svgEl('svg', { viewBox: '0 0 600 ' + height, width: '100%', height: height, role: 'img', 'aria-label': 'Budget split bar' });
  if (total <= 0) {
    svg.appendChild(NB.svgEl('rect', { x: 0, y: 0, width: 600, height: height, rx: 7, fill: '#eee7d6' }));
    return svg;
  }
  var x = 0;
  slices.forEach(function (s) {
    var w = Math.max(0, s.amount) / total * 600;
    if (w <= 0) return;
    svg.appendChild(NB.svgEl('rect', { x: x.toFixed(1), y: 0, width: w.toFixed(1), height: height, fill: s.color }));
    x += w;
  });
  return svg;
};
