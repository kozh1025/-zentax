/* Zentax Wrong Answer Tracker — localStorage version */
(function () {
  var KEY = 'zentax_gept_wrong';

  var T = window.ZTracker = {
    getAll: function () {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
    },
    _save: function (data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    },
    record: function (qid, setName, questionText, isCorrect) {
      var data = this.getAll();
      if (!data[qid]) {
        data[qid] = { qid: qid, setName: setName, question: questionText, wrongCount: 0, correctCount: 0, starred: false, lastResult: '', lastDate: '' };
      }
      var e = data[qid];
      e.setName = setName;
      if (questionText && questionText !== qid) e.question = questionText;
      e.lastDate = new Date().toISOString().slice(0, 10);
      e.lastResult = isCorrect ? 'correct' : 'wrong';
      if (isCorrect) { e.correctCount = (e.correctCount || 0) + 1; }
      else           { e.wrongCount   = (e.wrongCount   || 0) + 1; }
      this._save(data);
    },
    toggleStar: function (qid) {
      var data = this.getAll();
      if (data[qid]) {
        data[qid].starred = !data[qid].starred;
        this._save(data);
        return data[qid].starred;
      }
      return false;
    }
  };

  /* Auto-hook: override submitAll after the page script defines it */
  window.addEventListener('DOMContentLoaded', function () {
    var _orig = window.submitAll;
    if (typeof _orig !== 'function') return;

    window.submitAll = function () {
      _orig.apply(this, arguments);
      _hookRecord();
    };
  });

  function _hookRecord() {
    if (typeof allQids !== 'function' || typeof getAns !== 'function' || typeof userAns === 'undefined') return;

    var titleEl = document.querySelector('.hd-title');
    var setName = titleEl ? titleEl.textContent.trim() : 'Unknown';
    var m = setName.match(/第\s*(\d+)\s*組/);
    if (m) setName = 'SET-' + m[1].padStart(2, '0');

    allQids().forEach(function (qid) {
      var ans = getAns(qid);
      var ua  = userAns[qid];
      if (ua === undefined) return;

      var qtText = qid;
      var dotEl  = document.getElementById('dot_' + qid);
      if (dotEl) {
        var card = dotEl.closest('.qc');
        var qeEl = card && card.querySelector('.qe');
        if (qeEl) qtText = qeEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 120);
      }

      T.record(qid, setName, qtText, ua === ans);
    });
  }
})();
