(function () {
  'use strict';

  /* ============================================================
     Result Renderer — Diagnosis Card, Severity, Share
     ============================================================ */

  var SEVERITY_LABELS = {
    '重度': '建议入院观察',
    '中度': '临床症状明显',
    '轻度': '偶发症状',
    '边缘': '你可能是个正常人，再做一遍'
  };

  var RARITY_LABELS = {
    'SSR': 'SSR · 超稀有',
    'SR': 'SR · 稀有',
    'R': 'R · 常见'
  };

  var NEMESIS_REASON = {
    'score_slave|chaos_gremlin': '一个把游戏当命，一个把游戏当笑话',
    'chaos_gremlin|score_slave': '互相觉得对方"不懂游戏"',
    'pressure_monster|game_nanny': '一个全力输出队友，一个全力保护队友',
    'game_nanny|pressure_monster': '治愈 vs 伤害',
    'cyber_donkey|wanderer': '效率至上 vs 效率是什么能吃吗',
    'wanderer|score_slave': '方向感用在奇怪的地方 vs 方向感用在 Rank 上',
    'hamster|platinum_hunter': '囤积万岁 vs 多余的都卖掉换奖杯',
    'platinum_hunter|chaos_gremlin': '100% 的信仰 vs 0% 也无所谓',
    'archaeologist|pressure_monster': '看剧情 vs 跳过跳过跳过',
    'bug_conjurer|cyber_donkey': '破坏秩序 vs 秩序本身',
    'afk_immortal|score_slave': '在线时长 vs 有效时长',
    'whale|hamster': '挥霍 vs 囤积',
    'captain|pressure_monster': '从容嘲讽 vs 暴躁问责',
    'pressure_monster|captain': '暴躁问责 vs 从容嘲讽'
  };

  var container = document.getElementById('resultRoot');

  /* --- Init --- */
  function init() {
    var hashType = getHashType();
    var payload = getPayload();

    // Hash present — could be fresh test result or gallery browsing
    if (hashType) {
      // If hash matches stored result, use real payload (fresh from test)
      var isTestResult = payload && payload.type === hashType;
      var activeP = isTestResult ? payload : makeVirtualPayload(hashType);

      loadCharacters().then(function (chars) {
        var typeIds = hashType.split(',');
        if (typeIds.length === 2 && chars[typeIds[0]] && chars[typeIds[1]]) {
          renderDual(chars[typeIds[0]], chars[typeIds[1]], activeP);
        } else if (chars[typeIds[0]]) {
          renderSingle(chars[typeIds[0]], activeP);
        } else {
          renderEmpty();
        }
      }).catch(function () {
        renderEmpty();
      });
      return;
    }

    // No hash — use stored result from test
    if (!payload) {
      renderEmpty();
      return;
    }

    var typeIds = payload.type.split(',');

    loadCharacters().then(function (chars) {
      if (typeIds.length === 2 && chars[typeIds[0]] && chars[typeIds[1]]) {
        renderDual(chars[typeIds[0]], chars[typeIds[1]], payload);
      } else if (chars[typeIds[0]]) {
        renderSingle(chars[typeIds[0]], payload);
      } else {
        renderEmpty();
      }
    }).catch(function () {
      renderEmpty();
    });
  }

  function getHashType() {
    var hash = window.location.hash.replace('#', '');
    if (!hash) return null;
    // Validate: only allow known character IDs (comma-separated for dual)
    return hash;
  }

  function makeVirtualPayload(type) {
    return {
      type: type,
      scores: {},
      maxScore: 0,
      severityPct: 0,
      severityLabel: '边缘',
      bank: 'direct',
      timestamp: Date.now()
    };
  }

  function getPayload() {
    try {
      var raw = sessionStorage.getItem('bartle-result');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function loadCharacters() {
    return fetch('data/characters.json')
      .then(function (r) { return r.json(); })
      .catch(function () { return {}; });
  }

  /* --- Render: Single Type --- */
  function renderSingle(ch, p) {
    var sevTip = SEVERITY_LABELS[p.severityLabel] || '';
    var rarityText = RARITY_LABELS[ch.rarity] || '';
    var nemesis = getNemesis(ch);
    var nemKey = ch.id + '|' + ch.nemesis;
    var nemReason = NEMESIS_REASON[nemKey] || '八字不合';

    var html = '';

    // Diagnosis header
    html += '<div class="result__header">';
    html += '<p class="annotation">— 小黑诊断中心 · 心理评估报告 —</p>';
    html += '</div>';

    // Type label
    html += '<div class="result__label-row">';
    html += '<span class="result__emoji">' + ch.emoji + '</span>';
    html += '<h1 class="result__type">' + ch.label + '</h1>';
    html += '</div>';

    // Rarity badge
    html += '<span class="result-card__rarity">' + rarityText + '</span>';

    // Severity — only show for real test results
    if (p.bank !== 'direct') {
      html += '<div class="result__severity">';
      html += '<div class="result__severity-header">';
      html += '<span>临床严重程度</span>';
      html += '<span class="result__severity-pct">' + p.severityPct + '% — ' + p.severityLabel + '度</span>';
      html += '</div>';
      html += '<div class="severity"><div class="severity__fill" style="width:' + p.severityPct + '%"></div></div>';
      html += '<p class="result__severity-tip annotation">' + sevTip + '</p>';
      html += '</div>';
    }

    // Xiaohei illustration
    html += '<img class="result__illo" src="assets/images/' + ch.id + '.png.jpeg" alt="小黑 · ' + ch.label + '">';

    // One-liner
    html += '<p class="result__oneliner">' + ch.oneLiner + '</p>';

    // Diagnosis text
    html += '<div class="result__diagnosis">';
    html += '<p class="result__diagnosis-label annotation">临床诊断</p>';
    html += '<p class="body-text">' + ch.diagnosis + '</p>';
    html += '</div>';

    // Catchphrase
    html += '<blockquote class="result__quote">"' + ch.catchphrase + '"</blockquote>';

    // Games
    html += '<div class="result__games">';
    html += '<p class="annotation">代表游戏</p>';
    html += '<p class="text-dim" style="font-size: var(--text-sm);">' + ch.games.join(' / ') + '</p>';
    html += '</div>';

    // Nemesis
    if (nemesis) {
      html += '<div class="result__nemesis">';
      html += '<p class="annotation">命里克星</p>';
      html += '<p>' + nemesis.emoji + ' <strong>' + nemesis.label + '</strong></p>';
      html += '<p class="text-dim" style="font-size: var(--text-xs);">' + nemReason + '</p>';
      html += '</div>';
    }

    // Actions
    html += renderActions(p);

    container.innerHTML = html;
  }

  /* --- Render: Dual Personality --- */
  function renderDual(chA, chB, p) {
    var html = '';

    html += '<div class="result__header">';
    html += '<p class="annotation">— 小黑诊断中心 · 罕见病例 —</p>';
    html += '</div>';

    html += '<h2 class="result__dual-title">双重人格诊断</h2>';
    html += '<p class="body-text text-center">患者同时符合两种类型的临床表现，属于罕见共病案例。两边都不用治，你只是比普通人更复杂一点。</p>';

    // Side by side
    html += '<div class="result__dual-cards">';

    html += '<div class="result__dual-card">';
    html += '<img class="result__dual-illo" src="assets/images/' + chA.id + '.png.jpeg" alt="小黑 · ' + chA.label + '">';
    html += '<p class="result__dual-emoji">' + chA.emoji + '</p>';
    html += '<h3 class="result__dual-type">' + chA.label + '</h3>';
    html += '<p class="text-dim" style="font-size: var(--text-sm);">' + chA.oneLiner + '</p>';
    html += '<blockquote class="result__quote">"' + chA.catchphrase + '"</blockquote>';
    html += '</div>';

    html += '<div class="result__dual-vs">VS</div>';

    html += '<div class="result__dual-card">';
    html += '<img class="result__dual-illo" src="assets/images/' + chB.id + '.png.jpeg" alt="小黑 · ' + chB.label + '">';
    html += '<p class="result__dual-emoji">' + chB.emoji + '</p>';
    html += '<h3 class="result__dual-type">' + chB.label + '</h3>';
    html += '<p class="text-dim" style="font-size: var(--text-sm);">' + chB.oneLiner + '</p>';
    html += '<blockquote class="result__quote">"' + chB.catchphrase + '"</blockquote>';
    html += '</div>';

    html += '</div>';

    html += renderActions(p);

    container.innerHTML = html;
  }

  /* --- Render: Empty / Error --- */
  function renderEmpty() {
    container.innerHTML =
      '<div class="text-center mt-2xl">' +
      '<p class="body-text">还没有诊断记录。</p>' +
      '<p class="text-dim mt-lg" style="font-size: var(--text-sm);">请先完成测试再来查看结果。</p>' +
      '<a href="index.html" class="btn-cta mt-xl" style="display: inline-flex;">回到首页</a>' +
      '</div>';
  }

  /* --- Actions --- */
  function renderActions(p) {
    var isDirect = p.bank === 'direct';
    var shareText = buildShareText();
    var h = '';

    h += '<div class="result__actions">';

    if (!isDirect) {
      // Copy text
      h += '<button class="btn-cta" id="btnCopy" style="font-size: var(--text-sm); margin-bottom: var(--space-sm);">复制分享文案</button>';

      // Web Share
      h += '<button class="btn-cta" id="btnShare" style="font-size: var(--text-sm); margin-bottom: var(--space-sm); display: none;">一键分享</button>';

      // Poster
      h += '<br><button class="btn-cta" id="btnPoster" style="font-size: var(--text-sm); margin-bottom: var(--space-lg);">生成分享海报</button>';

      // Retake
      h += '<br><a href="test.html" class="text-dim" style="font-size: var(--text-xs); text-decoration: underline; text-underline-offset: 2px;">重新诊断</a>';
    } else {
      // Direct link from gallery — minimal actions
      h += '<a href="test.html" class="btn-cta" style="font-size: var(--text-sm); display: inline-flex;">开始诊断</a>';
    }

    // Types gallery link
    h += '<span style="margin: 0 var(--space-sm); color: var(--color-border);">|</span>';
    h += '<a href="types.html" class="text-dim" style="font-size: var(--text-xs); text-decoration: underline; text-underline-offset: 2px;">查看全部 12 型</a>';

    h += '</div>';

    // Attach handlers after render
    setTimeout(function () {
      attachShareHandlers(shareText);
    }, 100);

    return h;
  }

  function buildShareText() {
    var p = getPayload();
    if (!p) return '';

    var typeIds = p.type.split(',');
    var ch = null;
    // Try to load from the already-fetched characters
    // For simplicity, use type label from URL hash
    var label = typeIds.join(' / ');
    var hash = window.location.hash.replace('#', '');

    return '测了，我是 ' + label + '。我的游戏人格口头禅是：……你也来测测？' + window.location.origin + window.location.pathname.replace('result.html', '');
  }

  function attachShareHandlers(shareText) {
    var btnCopy = document.getElementById('btnCopy');
    var btnShare = document.getElementById('btnShare');
    var btnPoster = document.getElementById('btnPoster');

    if (btnPoster && window.BartleShare) {
      btnPoster.addEventListener('click', function () {
        window.BartleShare.generate();
      });
    } else if (btnPoster) {
      btnPoster.style.display = 'none';
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', function () {
        var text = shareText;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            btnCopy.textContent = '已复制！';
            setTimeout(function () { btnCopy.textContent = '复制分享文案'; }, 2000);
          }).catch(function () {
            fallbackCopy(text, btnCopy);
          });
        } else {
          fallbackCopy(text, btnCopy);
        }
      });
    }

    if (btnShare && navigator.share) {
      btnShare.style.display = 'inline-block';
      btnShare.addEventListener('click', function () {
        navigator.share({
          title: '游戏人格测试 — 你是什么玩家？',
          text: shareText,
          url: window.location.href
        }).catch(function () {});
      });
    }
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
    btn.textContent = '已复制！';
    setTimeout(function () { btn.textContent = '复制分享文案'; }, 2000);
  }

  function getNemesis(ch) {
    if (!ch.nemesis) return null;
    // Need to load characters to get nemesis label
    // For now, return a simple object with the ID
    return {
      id: ch.nemesis,
      label: getNemesisLabel(ch.nemesis),
      emoji: getNemesisEmoji(ch.nemesis)
    };
  }

  // Quick lookup — loaded from the characters.json
  var _nemLabels = {
    'chaos_gremlin': '乐子人',
    'score_slave': '分奴',
    'game_nanny': '游戏奶妈',
    'pressure_monster': '压力怪',
    'wanderer': '该溜子',
    'platinum_hunter': '白金人',
    'hamster': '仓鼠',
    'cyber_donkey': '赛博驴',
    'captain': '船长'
  };

  var _nemEmojis = {
    'chaos_gremlin': '🎪',
    'score_slave': '🏆',
    'game_nanny': '🛡️',
    'pressure_monster': '❓',
    'wanderer': '🗺️',
    'platinum_hunter': '🏅',
    'hamster': '🐹',
    'cyber_donkey': '🐴',
    'captain': '⚓'
  };

  function getNemesisLabel(id) { return _nemLabels[id] || id; }
  function getNemesisEmoji(id) { return _nemEmojis[id] || ''; }

  /* --- Bootstrap --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
