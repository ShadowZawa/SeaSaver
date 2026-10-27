const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual game state machine without wall-clock delays or audio.
function game() {
  const elements = new Map();
  let document;
  function element() {
    const classes = new Set();
    return {
      textContent: '', innerHTML: '', hidden: false, disabled: false, open: false,
      style: {}, dataset: {}, children: [], attributes: {}, handlers: {},
      classList: {add: x => classes.add(x), remove: x => classes.delete(x), toggle: (x, yes) => yes ? classes.add(x) : classes.delete(x)},
      setAttribute(key, value) {this.attributes[key] = value;},
      addEventListener(name, handler) {this.handlers[name] = handler;},
      append(child) {this.children.push(child);}, replaceChildren() {this.children = [];},
      get firstElementChild() {return this.children[0];},
      showModal() {this.open = true;}, close() {this.open = false;},
      focus() {document.activeElement = this;}, tagName: 'BUTTON',
      getBoundingClientRect: () => ({width: 1100, height: 650}),
    };
  }
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) elements.set(id, element());
  for (const item of elements.values()) item.parentElement = element();
  const drawing = new Proxy({}, {get: (_, key) => key === 'createLinearGradient' ? () => ({addColorStop() {}}) : () => {}});
  elements.get('ocean').getContext = () => drawing;
  const containers = new Map([['.top-actions', element()], ['.kindness', element()]]);
  document = {hidden: false, activeElement: element(), getElementById: id => elements.get(id),
    querySelector: selector => selector.startsWith('#') ? elements.get(selector.slice(1)) : containers.get(selector),
    createElement: element, addEventListener() {}};
  const sandbox = vm.createContext({document, window: {innerWidth: 1100, devicePixelRatio: 1, addEventListener() {}},
    ResizeObserver: class {observe() {}}, requestAnimationFrame() {}, setInterval() {}, clearInterval() {}, assert});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../ocean-cleanup.js'), 'utf8') + '\nmusicEnabled = false;', sandbox);
  return code => vm.runInContext(code, sandbox);
}

test('first discovery pauses time, persists across levels and retries, resets for a new journey', () => {
  game()(`resetJourney(); assert.equal(showCatchLesson(types[0]), true);
    const time = remaining; update(3); assert.equal(remaining, time);
    closeCatchLesson(); level = 1; startLevel(); assert.equal(showCatchLesson(types[0]), false);
    startLevel(); assert.equal(discoveredTypes.size, 1);
    resetJourney(); assert.equal(discoveredTypes.size, 0); assert.equal(showCatchLesson(types[0]), true);`);
});

test('journal preserves state and hook, freezes timer, and blocks game shortcuts', () => {
  game()(`resetJourney(); cast(); const time = remaining; const length = hook.length;
    openJournal(); update(5); primaryAction(); pause();
    assert.equal(state, 'journal'); assert.equal(remaining, time); assert.equal(hook.length, length);
    renderJournal(4); assert.ok($('journal-note').textContent.includes('象徵'));
    closeJournal(); assert.equal(state, 'playing'); assert.equal(hook.mode, 'out');
    pause(); openJournal(); closeJournal(); assert.equal(state, 'paused');
    pause(); openJournal(); document.hidden = true; closeJournal(); assert.equal(state, 'paused');`);
});

test('quiz requires an answer, explains incorrect choices, and counts each round once', () => {
  game()(`resetJourney(); caught = 4; score = 700; finish();
    assert.equal(state, 'quiz'); const time = remaining; update(3); assert.equal(remaining, time);
    completeQuiz(); primaryAction(); assert.equal(state, 'quiz');
    answerQuiz(0); assert.ok($('quiz-feedback').textContent.includes('換個做法'));
    assert.ok($('quiz-options').children[1].textContent.includes('建議做法'));
    const feedback = $('quiz-feedback').textContent; answerQuiz(1); assert.equal($('quiz-feedback').textContent, feedback);
    completeQuiz(); assert.equal(state, 'passed'); assert.equal(totalCaught, 4);
    finish(); completeQuiz(); assert.equal(totalCaught, 4);
    primaryAction(); assert.equal(level, 1); assert.equal(state, 'playing');`);
});

test('timeout, retry, final victory and new voyage remain reachable', () => {
  game()(`resetJourney(); remaining = .01; update(.02); answerQuiz(1); completeQuiz();
    assert.equal(state, 'lost'); primaryAction(); assert.equal(level, 0); assert.equal(state, 'playing');
    for (let index = 0; index < 3; index++) {
      score = levels[level].target; finish(); answerQuiz(questions[level].answer); completeQuiz();
      if (index < 2) primaryAction();
    }
    assert.equal(state, 'won'); assert.equal(learnedChoices.size, 3);
    openJournal(); closeJournal(); assert.equal(state, 'won');
    primaryAction(); assert.equal(level, 0); assert.equal(totalCaught, 0); assert.equal(learnedChoices.size, 0);`);
});

test('final new discovery leads to quiz; recovery and responsive resize preserve cargo', () => {
  game()(`resetJourney(); score = levels[0].target; caught = 5;
    showCatchLesson(types[2]); closeCatchLesson(); assert.equal(state, 'quiz');
    update(.5); assert.ok(recovery > 0); render();
    answerQuiz(1); completeQuiz(); primaryAction(); assert.equal(recovery, 0);
    hook.mode = 'back'; hook.cargo = objects[0]; const cargo = hook.cargo;
    window.innerWidth = 390; resize(); assert.equal(state, 'paused'); assert.equal(W, 650);
    assert.equal(hook.cargo, cargo); assert.equal(hook.mode, 'back'); render();`);
});
