(function () {
  'use strict';

  /* ============================================================
     Share Poster — html2canvas 1080×1920 vertical card
     ============================================================ */

  var POSTER_W = 1080;
  var POSTER_H = 1920;

  var RARITY_FULL = {
    'SSR': 'SSR · 超稀有（仅 3-5% 玩家）',
    'SR': 'SR · 稀有（仅 6-10% 玩家）',
    'R': 'R · 常见（11-18% 玩家）'
  };

  /* --- Public: generate poster from result payload --- */
  function generatePoster() {
    var p = getPayload();
    if (!p) {
      alert('请先完成测试再来生成海报。');
      return;
    }

    loadCharacters().then(function (chars) {
      var typeIds = p.type.split(',');

      if (typeIds.length === 2 && chars[typeIds[0]] && chars[typeIds[1]]) {
        generateDual(chars[typeIds[0]], chars[typeIds[1]], p);
      } else {
        var ch = chars[typeIds[0]];
        if (!ch) return;
        generateSingle(ch, p);
      }
    });
  }

  /* --- Single-type poster --- */
  function generateSingle(ch, p) {
    var img = new Image();
    img.onload = function () {
      capturePoster(buildPosterDOM(ch, p), function () { showFallback(ch, p); });
    };
    img.onerror = function () {
      capturePoster(buildPosterDOM(ch, p), function () { showFallback(ch, p); });
    };
    img.src = 'assets/images/' + ch.id + '.png.jpeg';
  }

  /* --- Dual-type poster --- */
  function generateDual(chA, chB, p) {
    var loaded = 0;
    function onBothReady() {
      loaded++;
      if (loaded === 2) {
        capturePoster(buildDualPosterDOM(chA, chB, p), function () { showFallbackDual(chA, chB, p); });
      }
    }
    var imgA = new Image();
    imgA.onload = onBothReady;
    imgA.onerror = onBothReady;
    imgA.src = 'assets/images/' + chA.id + '.png.jpeg';

    var imgB = new Image();
    imgB.onload = onBothReady;
    imgB.onerror = onBothReady;
    imgB.src = 'assets/images/' + chB.id + '.png.jpeg';
  }

  /* --- Shared html2canvas capture --- */
  function capturePoster(poster, fallbackFn) {
    document.body.appendChild(poster);

    if (typeof html2canvas === 'undefined') {
      fallbackFn();
      document.body.removeChild(poster);
      return;
    }

    html2canvas(poster, {
      width: POSTER_W,
      height: POSTER_H,
      scale: 1,
      backgroundColor: '#FEFEFE'
    }).then(function (canvas) {
      document.body.removeChild(poster);
      presentCanvas(canvas);
    }).catch(function () {
      document.body.removeChild(poster);
      fallbackFn();
    });
  }

  /* --- Build poster DOM — editorial asymmetric layout --- */
  function buildPosterDOM(ch, p) {
    var rarityText = RARITY_FULL[ch.rarity] || '';

    var html = '';

    // Stamp — left-aligned, sets the asymmetric spine
    html += '<span style="position:absolute;top:80px;left:80px;display:inline-block;' +
      'line-height:56px;padding:0 36px;' +
      'background:#D63031;color:#FEFEFE;font-size:24px;font-weight:700;' +
      'letter-spacing:0.3em;font-family:KaiTi,STKaiti,serif;white-space:nowrap;">' +
      '小黑诊断中心 · 心理评估报告</span>';

    // Image — full-width band, dramatic scale
    html += '<div style="position:absolute;top:200px;left:60px;width:960px;text-align:center;">';
    html += '<img src="assets/images/' + ch.id + '.png.jpeg" alt=""' +
      'style="display:inline-block;width:960px;height:480px;object-fit:contain;">';
    html += '</div>';

    // Type label — left-aligned, 150px, the hero element
    html += '<div style="position:absolute;top:740px;left:80px;width:920px;">';
    html += '<span style="font-size:150px;font-weight:900;line-height:1;' +
      'letter-spacing:-0.025em;">' + ch.label + '</span>';
    html += '</div>';

    // Rarity badge — left-aligned under the type
    html += '<div style="position:absolute;top:960px;left:80px;">';
    html += '<span style="display:inline-block;line-height:48px;padding:0 28px;' +
      'background:#D63031;font-size:22px;font-weight:700;color:#FEFEFE;' +
      'white-space:nowrap;font-family:SF Mono,Consolas,monospace;">' + rarityText + '</span>';
    html += '</div>';

    // Diagnostic marker — right-aligned, balances the left spine
    html += '<div style="position:absolute;top:970px;left:80px;width:920px;text-align:right;">';
    html += '<span style="font-size:22px;color:#B0B0B0;font-family:SF Mono,Consolas,monospace;">' +
      'No.' + (p.severityPct || '—') + ' · ' + (p.severityLabel || '—') + '度临床</span>';
    html += '</div>';

    // One-liner — centered, bridges the asymmetric top to the centered bottom
    html += '<div style="position:absolute;top:1060px;left:80px;width:920px;text-align:center;">';
    html += '<span style="font-size:40px;font-weight:700;line-height:1.35;">' + ch.oneLiner + '</span>';
    html += '</div>';

    // Catchphrase — centered, red, KaiTi
    html += '<div style="position:absolute;top:1200px;left:80px;width:920px;text-align:center;">';
    html += '<span style="font-size:34px;color:#D63031;line-height:1.4;' +
      'font-family:KaiTi,STKaiti,serif;letter-spacing:0.04em;">"' + ch.catchphrase + '"</span>';
    html += '</div>';

    // Severity bar
    html += '<div style="position:absolute;top:1340px;left:80px;width:920px;">';
    html += '<div style="font-size:22px;color:#8C8C8C;margin-bottom:8px;">';
    html += '<span>临床严重程度</span>';
    html += '<span style="float:right;font-weight:700;color:#D63031;">' + p.severityPct + '%</span>';
    html += '</div>';
    html += '<div style="clear:both;width:100%;height:10px;background:#ECECEC;border-radius:5px;overflow:hidden;">';
    html += '<div style="width:' + p.severityPct + '%;height:100%;background:#D63031;border-radius:5px;"></div>';
    html += '</div>';
    html += '</div>';

    // Divider
    html += '<div style="position:absolute;top:1460px;left:80px;width:920px;height:2px;background:#E8E0DC;"></div>';

    // QR + prompt side by side
    html += '<div style="position:absolute;top:1530px;left:80px;width:920px;height:180px;">';
    html += '<div style="position:absolute;left:0;top:0;">' + generateQRImgTag() + '</div>';
    html += '<div style="position:absolute;left:200px;top:40px;width:700px;">';
    html += '<p style="font-size:28px;font-weight:700;color:#1A1A1A;margin:0 0 10px 0;line-height:1.3;">' +
      '测测你是什么<br>游戏人格</p>';
    html += '<p style="font-size:18px;color:#8C8C8C;margin:0;">24 题 · 3 分钟 · 12 种诊断结果</p>';
    html += '</div>';
    html += '</div>';

    // Copyright
    html += '<div style="position:absolute;bottom:48px;left:0;width:100%;text-align:center;">';
    html += '<span style="font-size:18px;color:#B0B0B0;">' +
      'Character IP based on Ian Xiaohei by @helloianneo</span>';
    html += '</div>';

    var el = document.createElement('div');
    el.id = 'posterRoot';
    el.style.cssText =
      'position:fixed;left:-9999px;top:0;' +
      'width:' + POSTER_W + 'px;height:' + POSTER_H + 'px;' +
      'background:#FEFEFE;font-family:"PingFang SC","Microsoft YaHei",sans-serif;' +
      'color:#1A1A1A;overflow:hidden;';
    el.innerHTML = html;

    return el;
  }

  /* --- Build dual-personality poster DOM — editorial layout --- */
  function buildDualPosterDOM(chA, chB, p) {
    var rarityA = RARITY_FULL[chA.rarity] || '';
    var rarityB = RARITY_FULL[chB.rarity] || '';

    var html = '';

    // Stamp — left-aligned
    html += '<span style="position:absolute;top:80px;left:80px;display:inline-block;' +
      'line-height:56px;padding:0 36px;' +
      'background:#D63031;color:#FEFEFE;font-size:24px;font-weight:700;' +
      'letter-spacing:0.3em;font-family:KaiTi,STKaiti,serif;white-space:nowrap;">' +
      '小黑诊断中心 · 罕见共病病例</span>';

    // Two images side by side as a band
    html += '<div style="position:absolute;top:200px;left:60px;width:450px;text-align:center;">';
    html += '<img src="assets/images/' + chA.id + '.png.jpeg" alt=""' +
      'style="display:inline-block;width:420px;height:210px;object-fit:contain;">';
    html += '</div>';
    html += '<div style="position:absolute;top:200px;left:570px;width:450px;text-align:center;">';
    html += '<img src="assets/images/' + chB.id + '.png.jpeg" alt=""' +
      'style="display:inline-block;width:420px;height:210px;object-fit:contain;">';
    html += '</div>';

    // "×" — centered between images
    html += '<div style="position:absolute;top:260px;left:0;width:100%;text-align:center;">';
    html += '<span style="font-size:48px;font-weight:900;color:#D63031;line-height:1;">×</span>';
    html += '</div>';

    // Type labels — left-aligned in their columns
    html += '<div style="position:absolute;top:490px;left:80px;width:440px;">';
    html += '<span style="font-size:72px;font-weight:900;line-height:1;letter-spacing:-0.025em;">' + chA.label + '</span>';
    html += '</div>';
    html += '<div style="position:absolute;top:490px;left:560px;width:440px;">';
    html += '<span style="font-size:72px;font-weight:900;line-height:1;letter-spacing:-0.025em;">' + chB.label + '</span>';
    html += '</div>';

    // Rarity badges — left-aligned
    html += '<div style="position:absolute;top:590px;left:80px;">';
    html += '<span style="display:inline-block;line-height:40px;padding:0 20px;' +
      'background:#D63031;font-size:18px;font-weight:700;color:#FEFEFE;' +
      'white-space:nowrap;font-family:SF Mono,Consolas,monospace;">' + rarityA + '</span>';
    html += '</div>';
    html += '<div style="position:absolute;top:590px;left:560px;">';
    html += '<span style="display:inline-block;line-height:40px;padding:0 20px;' +
      'background:#D63031;font-size:18px;font-weight:700;color:#FEFEFE;' +
      'white-space:nowrap;font-family:SF Mono,Consolas,monospace;">' + rarityB + '</span>';
    html += '</div>';

    // "双重人格诊断" — small centered badge
    html += '<div style="position:absolute;top:700px;left:0;width:100%;text-align:center;">';
    html += '<span style="display:inline-block;line-height:44px;padding:0 28px;' +
      'background:#D63031;font-size:18px;font-weight:700;color:#FEFEFE;' +
      'letter-spacing:0.2em;white-space:nowrap;' +
      'font-family:KaiTi,STKaiti,serif;">双重人格诊断</span>';
    html += '</div>';

    // One-liners — centered in columns
    html += '<div style="position:absolute;top:820px;left:60px;width:450px;text-align:center;">';
    html += '<span style="font-size:24px;font-weight:700;line-height:1.4;">' + chA.oneLiner + '</span>';
    html += '</div>';
    html += '<div style="position:absolute;top:820px;left:570px;width:450px;text-align:center;">';
    html += '<span style="font-size:24px;font-weight:700;line-height:1.4;">' + chB.oneLiner + '</span>';
    html += '</div>';

    // Catchphrases
    html += '<div style="position:absolute;top:960px;left:60px;width:450px;text-align:center;">';
    html += '<span style="font-size:22px;color:#D63031;line-height:1.4;' +
      'font-family:KaiTi,STKaiti,serif;letter-spacing:0.04em;">"' + chA.catchphrase + '"</span>';
    html += '</div>';
    html += '<div style="position:absolute;top:960px;left:570px;width:450px;text-align:center;">';
    html += '<span style="font-size:22px;color:#D63031;line-height:1.4;' +
      'font-family:KaiTi,STKaiti,serif;letter-spacing:0.04em;">"' + chB.catchphrase + '"</span>';
    html += '</div>';

    // Severity bar
    html += '<div style="position:absolute;top:1120px;left:80px;width:920px;">';
    html += '<div style="font-size:22px;color:#8C8C8C;margin-bottom:8px;">';
    html += '<span>临床严重程度（共病指数）</span>';
    html += '<span style="float:right;font-weight:700;color:#D63031;">' + p.severityPct + '%</span>';
    html += '</div>';
    html += '<div style="clear:both;width:100%;height:10px;background:#ECECEC;border-radius:5px;overflow:hidden;">';
    html += '<div style="width:' + p.severityPct + '%;height:100%;background:#D63031;border-radius:5px;"></div>';
    html += '</div>';
    html += '</div>';

    // Divider
    html += '<div style="position:absolute;top:1240px;left:80px;width:920px;height:2px;background:#E8E0DC;"></div>';

    // QR + prompt side by side
    html += '<div style="position:absolute;top:1310px;left:80px;width:920px;height:180px;">';
    html += '<div style="position:absolute;left:0;top:0;">' + generateQRImgTag() + '</div>';
    html += '<div style="position:absolute;left:200px;top:40px;width:700px;">';
    html += '<p style="font-size:28px;font-weight:700;color:#1A1A1A;margin:0 0 10px 0;line-height:1.3;">' +
      '测测你是什么<br>游戏人格</p>';
    html += '<p style="font-size:18px;color:#8C8C8C;margin:0;">24 题 · 3 分钟 · 12 种诊断结果</p>';
    html += '</div>';
    html += '</div>';

    // Copyright
    html += '<div style="position:absolute;bottom:48px;left:0;width:100%;text-align:center;">';
    html += '<span style="font-size:18px;color:#B0B0B0;">' +
      'Character IP based on Ian Xiaohei by @helloianneo</span>';
    html += '</div>';

    var el = document.createElement('div');
    el.id = 'posterRoot';
    el.style.cssText =
      'position:fixed;left:-9999px;top:0;' +
      'width:' + POSTER_W + 'px;height:' + POSTER_H + 'px;' +
      'background:#FEFEFE;font-family:"PingFang SC","Microsoft YaHei",sans-serif;' +
      'color:#1A1A1A;overflow:hidden;';
    el.innerHTML = html;

    return el;
  }

  /* --- Present canvas to user --- */
  function presentCanvas(canvas) {
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);

      var overlay = document.createElement('div');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;';

      var img = document.createElement('img');
      img.src = url;
      img.style.cssText = 'max-width:90vw;max-height:75vh;display:block;box-shadow:0 4px 24px rgba(0,0,0,0.4);';

      var actions = document.createElement('div');
      actions.style.cssText = 'margin-top:24px;display:flex;gap:16px;flex-wrap:wrap;justify-content:center;';

      var btnDown = document.createElement('button');
      btnDown.textContent = '保存图片';
      btnDown.style.cssText =
        'padding:12px 32px;font-size:16px;font-weight:700;color:#FEFEFE;' +
        'background:#1A1A1A;border:2px solid #FEFEFE;cursor:pointer;font-family:inherit;';
      btnDown.addEventListener('click', function () {
        var a = document.createElement('a');
        a.href = url;
        a.download = 'game-personality-' + (getPayload() ? getPayload().type : 'result') + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });

      var btnClose = document.createElement('button');
      btnClose.textContent = '关闭';
      btnClose.style.cssText =
        'padding:12px 32px;font-size:16px;font-weight:700;color:#FEFEFE;' +
        'background:transparent;border:2px solid #FEFEFE;cursor:pointer;font-family:inherit;';
      btnClose.addEventListener('click', function () {
        document.body.removeChild(overlay);
        URL.revokeObjectURL(url);
      });

      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          URL.revokeObjectURL(url);
        }
      });

      actions.appendChild(btnDown);
      actions.appendChild(btnClose);
      overlay.appendChild(img);
      overlay.appendChild(actions);
      document.body.appendChild(overlay);
    }, 'image/png');
  }

  /* --- Fallback: text-only share --- */
  function showFallback(ch, p) {
    var text = buildShareText(ch, p);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        alert('海报生成失败，但分享文案已复制到剪贴板！');
      }).catch(function () {
        alert('分享文案：\n\n' + text);
      });
    } else {
      prompt('复制以下分享文案：', text);
    }
  }

  function buildShareText(ch, p) {
    return '测了，我是 ' + ch.label + '（' + (RARITY_FULL[ch.rarity] || '') + '）。' +
      '我的游戏人格口头禅是："' + ch.catchphrase + '" ' +
      '你也来测测？ ' + window.location.origin + window.location.pathname.replace('result.html', '');
  }

  function showFallbackDual(chA, chB, p) {
    var text = buildDualShareText(chA, chB, p);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        alert('海报生成失败，但分享文案已复制到剪贴板！');
      }).catch(function () {
        alert('分享文案：\n\n' + text);
      });
    } else {
      prompt('复制以下分享文案：', text);
    }
  }

  function buildDualShareText(chA, chB, p) {
    return '测了，我是 ' + chA.label + ' × ' + chB.label + '（双重人格）。' +
      '我的游戏人格口头禅是："' + chA.catchphrase + '" 和 "' + chB.catchphrase + '" ' +
      '你也来测测？ ' + window.location.origin + window.location.pathname.replace('result.html', '');
  }

  /* --- Helpers --- */
  function getPayload() {
    try {
      var raw = sessionStorage.getItem('bartle-result');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function loadCharacters() {
    return fetch('data/characters.json')
      .then(function (r) { return r.json(); })
      .catch(function () { return {}; });
  }

  function getHomeUrl() {
    return window.location.origin + window.location.pathname.replace(/result\.html$/, 'index.html');
  }

  function generateQRImgTag() {
    try {
      if (typeof qrcode === 'undefined') return '';
      var qr = qrcode(0, 'L');
      qr.addData(getHomeUrl());
      qr.make();
      var dataUrl = qr.createDataURL(4);
      return '<img src="' + dataUrl + '" alt="QR" ' +
        'style="display:block;width:160px;height:160px;margin:0 auto;">';
    } catch (_) {
      return '';
    }
  }

  /* --- Expose --- */
  window.BartleShare = { generate: generatePoster };

})();
