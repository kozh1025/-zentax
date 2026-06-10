/* Zentax Wrong Answer Tracker — localStorage version */
(function () {
  var KEY = 'zentax_wrong';

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

  /* Hook submitAll */
  var _orig = window.submitAll;
  if (typeof _orig === 'function') {
    window.submitAll = function () {
      _orig.apply(this, arguments);
      _hookRecord();
    };
  }

  function _captureDetail(qid) {
    var dotEl = document.getElementById('dot_' + qid);
    if (!dotEl) return null;
    var card = dotEl.closest('.qc');
    if (!card) return null;

    var d = { qid: qid, qText: '', qzText: '', opts: [], key: '', trap: '', gram: '' };

    var qeEl = card.querySelector('.qe');
    if (qeEl) d.qText = qeEl.textContent.replace(/\s+/g, ' ').trim();

    var qzEl = card.querySelector('.qz');
    if (qzEl) d.qzText = qzEl.textContent.replace(/\s+/g, ' ').trim();

    card.querySelectorAll('.opt').forEach(function (optEl) {
      var lbl  = optEl.querySelector('.opt-lbl')  ? optEl.querySelector('.opt-lbl').textContent.trim()  : '';
      var word = optEl.querySelector('.opt-word') ? optEl.querySelector('.opt-word').textContent.trim() : '';
      var pos  = optEl.querySelector('.opt-pos')  ? optEl.querySelector('.opt-pos').textContent.trim()  : '';
      var zh   = optEl.querySelector('.opt-zh')   ? optEl.querySelector('.opt-zh').textContent.trim()   : '';
      d.opts.push({
        lbl:     lbl,
        word:    word,
        pos:     pos,
        zh:      zh,
        correct: optEl.classList.contains('correct'),
        wrong:   optEl.classList.contains('wrong')
      });
    });

    var anaKey  = card.querySelector('.ana-key');
    var anaTrap = card.querySelector('.ana-trap');
    var anaGram = card.querySelector('.ana-gram');
    if (anaKey)  d.key  = anaKey.textContent.replace(/\s+/g, ' ').trim();
    if (anaTrap) d.trap = anaTrap.textContent.replace(/\s+/g, ' ').trim();
    if (anaGram) d.gram = anaGram.textContent.replace(/\s+/g, ' ').trim();

    return d;
  }

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

    /* Second pass: store structured detail for every answered question */
    var data = T.getAll();
    var dirty = false;
    allQids().forEach(function (qid) {
      if (userAns[qid] === undefined) return;
      var det = _captureDetail(qid);
      if (det && data[qid]) {
        data[qid]._detail = det;
        dirty = true;
      }
    });
    if (dirty) T._save(data);
  }
})();
