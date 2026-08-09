// finance/js/finance-charts.js — Canvas 2D charts

function resizeCanvas(canvasId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  var rect = canvas.parentElement.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  var W = rect.width || 200;
  var H = rect.height || 200;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx: ctx, W: W, H: H };
}

function drawLineChart(canvasId, labels, datasets) {
  var r = resizeCanvas(canvasId);
  if (!r) return;
  var ctx = r.ctx, W = r.W, H = r.H;
  var pad = { top: 15, right: 15, bottom: 45, left: 55 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;
  var numPoints = labels.length;

  if (numPoints < 2 || !datasets.length) return;

  var maxVal = 0;
  datasets.forEach(function(ds) { ds.data.forEach(function(v) { if (v > maxVal) maxVal = v; }); });
  if (maxVal === 0) maxVal = 1000;
  var range = maxVal;

  function xPos(i) { return pad.left + (i / (numPoints - 1)) * plotW; }
  function yPos(v) { return pad.top + plotH - (v / range) * plotH; }

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 1;
  for (var g = 0; g <= 5; g++) {
    var y = pad.top + (g / 5) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#999';
  ctx.font = '10px sans-serif';
  for (var g = 0; g <= 5; g++) {
    var y = pad.top + (g / 5) * plotH;
    ctx.fillText(fmtShort(maxVal - (g / 5) * maxVal), pad.left - 5, y + 3);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#666';
  ctx.font = '9px sans-serif';
  for (var i = 0; i < numPoints; i++) {
    ctx.fillText(labels[i], xPos(i), H - pad.bottom + 15);
  }

  datasets.forEach(function(ds) {
    if (!ds.fill) return;
    ctx.fillStyle = ds.fill;
    ctx.beginPath();
    ctx.moveTo(xPos(0), pad.top + plotH);
    for (var i = 0; i < numPoints; i++) ctx.lineTo(xPos(i), yPos(ds.data[i]));
    ctx.lineTo(xPos(numPoints - 1), pad.top + plotH);
    ctx.closePath();
    ctx.fill();
  });

  datasets.forEach(function(ds) {
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < numPoints; i++) {
      if (i === 0) ctx.moveTo(xPos(i), yPos(ds.data[i]));
      else ctx.lineTo(xPos(i), yPos(ds.data[i]));
    }
    ctx.stroke();
  });

  datasets.forEach(function(ds) {
    ctx.fillStyle = ds.color;
    for (var i = 0; i < numPoints; i++) {
      ctx.beginPath(); ctx.arc(xPos(i), yPos(ds.data[i]), 3, 0, Math.PI * 2); ctx.fill();
    }
  });

  var lx = pad.left;
  ctx.textAlign = 'left';
  ctx.font = '10px sans-serif';
  datasets.forEach(function(ds) {
    ctx.fillStyle = ds.color;
    ctx.fillRect(lx, H - 10, 12, 3);
    ctx.fillStyle = '#333';
    ctx.fillText(ds.label, lx + 16, H - 4);
    lx += ctx.measureText(ds.label).width + 28;
  });
}

function drawDonutChart(canvasId, segments) {
  var r = resizeCanvas(canvasId);
  if (!r) return;
  var ctx = r.ctx, W = r.W, H = r.H;

  var total = 0;
  segments.forEach(function(s) { total += Math.max(0, s.value); });
  if (total === 0) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ccc';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data', W/2, H/2);
    return;
  }

  ctx.clearRect(0, 0, W, H);

  var cx = W / 2;
  var cy = H / 2 - 10;
  var outerR = Math.min(W, H) / 2 - 15;
  var innerR = outerR * 0.55;
  var startAngle = -Math.PI / 2;

  segments.forEach(function(s) {
    var value = Math.max(0, s.value);
    var angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + angle);
    ctx.arc(cx, cy, innerR, startAngle + angle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    startAngle += angle;
  });

  ctx.fillStyle = '#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(fmtShort(total), cx, cy - 5);
  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#999';
  ctx.fillText('Total', cx, cy + 9);

  var lx = 10;
  var ly = H - 8;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '9px sans-serif';
  segments.forEach(function(s) {
    var pct = ((s.value / total) * 100).toFixed(1);
    var label = s.label + ' ' + pct + '%';
    var tw = ctx.measureText(label).width;
    if (lx + tw + 30 > W) { lx = 10; ly -= 14; }
    ctx.fillStyle = s.color;
    ctx.fillRect(lx, ly - 7, 9, 9);
    ctx.fillStyle = '#333';
    ctx.fillText(label, lx + 13, ly);
    lx += tw + 22;
  });
}
