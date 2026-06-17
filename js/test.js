(function () {
  'use strict';

  /* ============================================================
     Test Engine — Scoring, Redirect, Transition, Handoff
     ============================================================ */

  var MAX_SCORE = 12;   // max possible for one type (6 appearances × 2 pts)

  var BARTLE = {
    killer:     ['score_slave', 'pressure_monster', 'chaos_gremlin'],
    achiever:   ['cyber_donkey', 'hamster', 'platinum_hunter'],
    explorer:   ['wanderer', 'archaeologist', 'bug_conjurer'],
    socializer: ['game_nanny', 'afk_immortal', 'whale']
  };

  function getQuadrant(typeId) {
    for (var q in BARTLE) {
      if (BARTLE[q].indexOf(typeId) !== -1) return q;
    }
    return null;
  }

  /* --- State --- */
  var bank = 'main';
  var questions = [];
  var scores = {};
  var currentIdx = 0;
  var locked = false;
  var forcedResult = null;  // override result when a hook option is selected

  /* --- DOM refs --- */
  var stage, progressFill, counter;
  var carryScores = null;  // preserved scores across bank redirect
  var bankRedirected = false;  // only redirect once — stay in chosen bank

  /* --- Init --- */
  function init() {
    stage = document.getElementById('questionStage');
    progressFill = document.querySelector('.test__progress-fill');
    counter = document.querySelector('.test__counter');

    loadBank('main', null);
  }

  function loadBank(id, carry) {
    bank = id;
    var url = id === 'eggy' ? 'data/questions-eggy.json' : 'data/questions.json';

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        questions = data.questions;
        // Strip redirect from Q1-C in the target bank to prevent ping-pong
        if (bankRedirected && questions[0]) {
          questions[0].options.forEach(function (o) {
            if (o.redirect) delete o.redirect;
          });
        }
        scores = {};
        data.meta.types.forEach(function (t) { scores[t.id] = 0; });
        // Merge carried scores from the redirect option
        if (carry) {
          for (var k in carry) {
            if (scores.hasOwnProperty(k)) scores[k] = carry[k];
          }
        }
        currentIdx = 0;
        forcedResult = null;
        render();
      })
      .catch(function (err) {
        stage.innerHTML = '<p class="text-dim text-center mt-2xl">题库加载失败，请刷新页面重试。</p>';
        console.error('Test engine: failed to load questions', err);
      });
  }

  /* --- Render --- */
  function render() {
    if (currentIdx >= questions.length) {
      finish();
      return;
    }

    var q = questions[currentIdx];
    updateProgress();

    var html = '<div class="test__question-wrap enter" id="qWrap">';
    html += '<h2 class="test__question">' + escapeHTML(q.text) + '</h2>';
    html += '<div class="test__options" id="qOptions">';

    q.options.forEach(function (opt) {
      html +=
        '<button class="opt" data-key="' + opt.key + '">' +
        '<span class="opt__key">' + opt.key + '</span>' +
        '<span class="opt__text">' + escapeHTML(opt.text) + '</span>' +
        '</button>';
    });

    html += '</div></div>';
    stage.innerHTML = html;

    locked = false;
    attachHandlers(q);
  }

  function updateProgress() {
    var pct = ((currentIdx + 1) / questions.length * 100).toFixed(1);
    progressFill.style.width = pct + '%';
    counter.textContent = (currentIdx + 1) + ' / ' + questions.length;
  }

  /* --- Interaction --- */
  function attachHandlers(question) {
    var buttons = document.querySelectorAll('#qOptions .opt');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (locked) return;
        locked = true;

        var key = btn.getAttribute('data-key');
        var option = question.options.find(function (o) { return o.key === key; });

        // Score
        if (option && option.scores) {
          for (var typeId in option.scores) {
            if (scores.hasOwnProperty(typeId)) {
              scores[typeId] += option.scores[typeId];
            }
          }
        }

        // Visual feedback
        btn.classList.add('flash');

        // Check for override — hook option forces a specific result
        if (option && option.override) {
          forcedResult = option.override;
        }

        // Check redirect — only once per test
        if (option && option.redirect && !bankRedirected) {
          bankRedirected = true;
          // Strip redirect from the new bank's Q1-C so it can't switch back
          var targetBank = option.redirect;
          setTimeout(function () {
            loadBank(targetBank, scores);
          }, 200);
          return;
        }

        // Advance
        setTimeout(function () {
          var wrap = document.getElementById('qWrap');
          if (wrap) wrap.classList.add('exit');

          setTimeout(function () {
            currentIdx++;
            render();
          }, 250);
        }, 200);
      });
    });
  }

  /* --- Result --- */
  function finish() {
    var resultType;
    var maxScore;

    if (forcedResult) {
      // Hook override — force result regardless of scores
      resultType = forcedResult;
      // Calculate maxScore from accumulated scores for severity display
      maxScore = 0;
      for (var tid in scores) {
        if (scores[tid] > maxScore) maxScore = scores[tid];
      }
    } else {
      // Find highest score
      maxScore = 0;
      var topTypes = [];

      for (var typeId in scores) {
        if (scores[typeId] > maxScore) {
          maxScore = scores[typeId];
          topTypes = [typeId];
        } else if (scores[typeId] === maxScore) {
          topTypes.push(typeId);
        }
      }

      // Tiebreak
      if (topTypes.length === 1) {
        resultType = topTypes[0];
      } else if (topTypes.length === 2) {
        // Compare Bartle quadrants — pick if same quadrant, else dual
        var q0 = getQuadrant(topTypes[0]);
        var q1 = getQuadrant(topTypes[1]);
        if (q0 === q1) {
          // Same quadrant — pick the one with more total in-quadrant support
          var score0 = scores[topTypes[0]];
          var score1 = scores[topTypes[1]];
          resultType = score0 >= score1 ? topTypes[0] : topTypes[1];
        } else {
          // Different quadrants — hard tie, dual personality
          resultType = topTypes.join(',');
        }
      } else {
        resultType = topTypes.join(',');
      }
    }

    // Severity
    var severityPct = Math.round(maxScore / MAX_SCORE * 100);
    var severityLabel;
    if (severityPct >= 83) severityLabel = '重度';
    else if (severityPct >= 67) severityLabel = '中度';
    else if (severityPct >= 50) severityLabel = '轻度';
    else severityLabel = '边缘';

    // Handoff via sessionStorage
    var payload = {
      type: resultType,
      scores: scores,
      maxScore: maxScore,
      severityPct: severityPct,
      severityLabel: severityLabel,
      bank: bank,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem('bartle-result', JSON.stringify(payload));
    } catch (_) {}

    // Navigate to result page
    window.location.href = 'result.html#' + resultType;
  }

  /* --- Helpers --- */
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* --- Bootstrap --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
