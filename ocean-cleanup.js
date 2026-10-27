const canvas = document.querySelector('#ocean');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
let W = window.innerWidth <= 600 ? 650 : 1100;
const H = 650, origin = { x: W / 2, y: 156 };
const levels = [
  {name: '晴空海灣', target: 650, time: 75, speed: .85},
  {name: '珊瑚海岸', target: 950, time: 80, speed: 1},
  {name: '深藍航道', target: 1250, time: 90, speed: 1.15},
];
const types = [
  {name: '鋁罐', icon: '🥫', points: 50, weight: .6, radius: 22},
  {name: '塑膠瓶', icon: '🧴', points: 80, weight: .9, radius: 23},
  {name: '塑膠袋', icon: '🛍️', points: 100, weight: 1.2, radius: 26},
  {name: '廢棄輪胎', icon: '🛞', points: 150, weight: 2, radius: 31},
  {name: '廢棄油桶', icon: '🛢️', points: 220, weight: 3, radius: 35},
];
const seaStories = [
  {
    type: 2, title: '塑膠袋，不該成為鯨魚的晚餐',
    location: '泰國 · 2018 年', icon: '🛍️',
    meaning: '這一關的塑膠袋，代表被海洋動物吞下的日常廢棄物。撈起它，也提醒我們減少一次性塑膠。',
    impact: '2018 年，泰國一隻領航鯨死亡後，解剖發現胃裡有 80 個塑膠袋，合計約 8 公斤。看似輕薄的袋子，也可能讓生命付出沉重代價。',
    action: '出門自備購物袋；把自己的垃圾帶回合適的回收或垃圾收集處。',
    source: '中央社 · 2018-06-03 · 繁體中文',
    headline: '誤食80多個塑膠袋 領航鯨命喪泰國南部',
    url: 'https://www.cna.com.tw/news/aopl/201806030023.aspx',
    note: '關卡為虛構海域，塑膠袋取材自真實事件；其餘垃圾為一般清海物件。',
    catchMessage: '少一個塑膠袋，多一分安心。',
  },
  {
    type: 3, title: '廢輪胎與大型海廢，讓海洋與漁民受傷',
    location: '台灣高雄蚵子寮 · 2025 年', icon: '🛞',
    meaning: '這一關的輪胎，代表被棄置在海裡的大型垃圾。它們不只是礙眼，也會影響漁民作業與海洋環境。',
    impact: '2025 年，公視報導高雄蚵子寮外海出現輪胎、家電殘骸與粗纜繩等海廢。漁民表示垃圾污染海洋，也造成漁網破損與經濟損失。這些廢棄物帶來的代價，落在靠海生活的人身上。',
    action: '廢輪胎交給合適的回收管道；再利用需要專業處理與評估，不是把原輪胎直接丟進海裡。',
    source: '公視新聞網 · 2025-12-12 · 繁體中文',
    headline: '高雄蚵子寮漁港撈到家電海廢 漁民質疑商貨船丟棄',
    url: 'https://news.pts.org.tw/article/785676',
    note: '報導談的是多種大型海廢造成的影響；不能把全部漁網損害歸因於輪胎，棄置來源也仍屬漁民質疑。',
    catchMessage: '帶走廢輪胎，把大海留給海洋生物。',
  },
  {
    type: 4, title: '漏出的燃油，留下的不只是油污',
    location: '模里西斯 · 2020 年', icon: '🛢️',
    meaning: '這一關的油桶象徵海上油污染：事故影響可能從海水延伸到生態與靠海維生的人們。',
    impact: '2020 年，Wakashio 貨輪在模里西斯外海觸礁後漏油。中央社報導，燃油污染當地珊瑚礁、瀉湖與沙灘，模里西斯宣布環境緊急狀態，並尋求國際協助清理。',
    action: '發現海岸油污，通報當地主管機關；油污清理由專業人員處理。',
    source: '中央社 · 2020-08-09 · 繁體中文',
    headline: '日本貨輪觸礁漏油 引發模里西斯環境浩劫',
    url: 'https://www.cna.com.tw/news/firstnews/202008090077.aspx',
    note: '油桶是遊戲中的象徵物；真實事件是船舶燃油外洩，並非撈起油桶就能處理。',
    catchMessage: '油桶是提醒：守護海洋，從預防污染開始。',
  },
];
let state = 'ready', level = 0, score = 0, remaining = 75, clock = 0, last = 0;
let hook = {mode: 'swing', angle: 0, length: 42, cargo: null};
let objects = [], fish = [], particles = [], floats = [], caught = 0, totalCaught = 0;
let sound = false, audio, toastUntil = 0;
let musicEnabled = true, musicGain, musicTimer = null, musicStep = 0, nextBeat = 0, musicVolume = .35, lastMusicLevel = -1;
const musicVoices = new Set();
// Original eight-bar sea-adventure loop: soft plucks, warm bass and floating chords.
const seaMelody = [76,79,81,79,76,74,72,74, 76,79,84,81,79,76,74,0,
  77,81,84,81,77,76,74,76, 77,81,86,84,81,77,76,0,
  79,83,86,83,79,76,74,76, 79,83,88,86,83,79,76,0,
  77,79,81,79,77,76,74,72, 74,76,79,76,74,72,0,0];
const seaChords = [[48,60,64,67],[48,60,64,67],[53,60,65,69],[53,60,65,69],
  [55,62,67,71],[55,62,67,71],[53,60,65,69],[55,62,67,71]];
function ensureAudio() {
  audio ??= new (window.AudioContext || window.webkitAudioContext)();
  audio.resume().catch(() => {});
  if (!musicGain) { musicGain = audio.createGain(); musicGain.gain.value = 0; musicGain.connect(audio.destination); }
}
function musicNote(note, at, duration, volume, waveform = 'sine') {
  if (!note) return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = waveform; oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
  gain.gain.setValueAtTime(.001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + .02);
  gain.gain.exponentialRampToValueAtTime(.001, at + duration);
  oscillator.connect(gain); gain.connect(musicGain);
  musicVoices.add(oscillator);
  oscillator.onended = () => { musicVoices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(at); oscillator.stop(at + duration + .03);
}
function updateMusicVolume() {
  if (!musicGain) return;
  const volume = musicEnabled && !document.hidden ? musicVolume * (state === 'playing' ? .5 : .18) : 0;
  if (lastMusicLevel === volume) return;
  lastMusicLevel = volume;
  musicGain.gain.setTargetAtTime(volume, audio.currentTime, .1);
}
function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
  for (const voice of musicVoices) {try {voice.stop();} catch {}}
  musicVoices.clear(); updateMusicVolume();
}
function startMusic() {
  if (!musicEnabled || document.hidden || musicTimer !== null) return;
  try {
    ensureAudio(); updateMusicVolume(); nextBeat = audio.currentTime + .04;
    const beat = 60 / 96 / 2;
    const schedule = () => {
      if (audio.state !== 'running') {nextBeat = audio.currentTime + .04;return;}
      if (nextBeat < audio.currentTime) nextBeat = audio.currentTime + .04;
      while (nextBeat < audio.currentTime + .18) {
        const step = musicStep % 64, chord = seaChords[Math.floor(step / 8)];
        musicNote(seaMelody[step], nextBeat, .42, .16, 'triangle');
        if (step % 4 === 0) musicNote(chord[0], nextBeat, .6, .22);
        if (step % 8 === 0) chord.slice(1).forEach(note => musicNote(note, nextBeat, 2.3, .055));
        if (step % 2 === 1) musicNote(chord[1] + 12, nextBeat, .11, .035, 'triangle');
        nextBeat += beat; musicStep++;
      }
    };
    schedule(); musicTimer = setInterval(schedule, 80);
  } catch {
    musicEnabled = false; $('music').textContent = '音樂無法播放'; $('music').setAttribute('aria-pressed', 'false');
  }
}
let releasedFish = 0;
let discoveredTypes = new Set();
let kindActionIndex = 0, journalReturnState = 'ready', journalFocus = null;
let recovery = 0, quizAnswered = false;
const learnedChoices = new Set();
const shortImpacts = [
  '破損金屬罐的尖銳邊緣可能讓海岸活動的人受傷。帶走垃圾，也把安全留給下一個人。',
  '塑膠碎成微小顆粒，不代表污染消失。減少一次性容器，從源頭少留一件海廢。',
  '漂流的塑膠袋可能被海洋動物吞下。日常少用一個袋子，就是守護生命的一個開始。',
  '輪胎等大型海廢會影響海洋環境與漁民作業，應交由合適的回收管道處理。',
  '油污染會影響海洋生態與沿岸生活。遊戲油桶是象徵，現實油污需要通報與專業處理。',
];
const questions = [
  {question: '準備去海邊玩，哪一個做法能從源頭減少塑膠垃圾？',
    options: ['把用完的塑膠袋埋進沙裡', '自備水壺與購物袋，帶走自己的垃圾', '把塑膠瓶弄碎，讓它變得看不見'], answer: 1,
    explanation: '自備用品可以減少一次性塑膠；把垃圾帶走並妥善分類，才能避免它留在海岸。埋起來或弄碎都不會讓污染消失。', takeaway: '自備用品、帶走垃圾，從源頭減塑。'},
  {question: '家中有一個不要的廢輪胎，你會怎麼處理？',
    options: ['交給合適的回收管道', '丟進海裡，讓魚躲在裡面', '留在岸邊，等海水帶走'], answer: 0,
    explanation: '廢輪胎應交給合適的回收管道。海洋再利用需要專業處理與評估，不能直接把輪胎丟進海裡。', takeaway: '大型廢棄物交給合適的回收管道。'},
  {question: '散步時發現岸邊有油污，哪個做法更合適？',
    options: ['直接下水，用手把油污撈起來', '倒入清潔劑，把油污沖散', '保持距離，通報當地主管機關'], answer: 2,
    explanation: '保持距離並通報，讓專業人員評估與清理。遊戲中的打撈只是象徵，真實油污染不能靠撈起油桶解決。', takeaway: '遇到油污保持距離、通報，交由專業處理。'},
];
const kindActions = ['今天試著自備水壺或購物袋，少用一件一次性用品。',
  '今天把自己的垃圾帶走、分類，把乾淨留給下一個人。',
  '今天向清潔人員、志工或身邊付出的人說一句謝謝。'];
const catchStories = [
  {
    type: 0, title: '破損的金屬罐，是海岸上的隱藏利刃', icon: '🥫',
    impact: '荒野保護協會的海岸安全調查指出，被遺留在海邊的鐵鋁罐、玻璃瓶等垃圾，除了造成髒亂與生態危害，尖銳的金屬與鏽蝕廢棄物也會成為隱蔽陷阱，讓海岸活動多了受傷風險。',
    action: '飲料喝完，把罐子帶離海邊並依當地規定回收。',
    source: '荒野保護協會 · 2021-03-22 · 台灣環團新聞稿',
    headline: '你腳底下的海岸安全嗎？荒野保護協會揭露台灣安全海岸排名',
    url: 'https://www.sow.org.tw/info/news/20210322/42155',
    linkLabel: '閱讀新聞稿',
    note: '來源為台灣環團的調查新聞稿，並非媒體採訪；尖銳破損邊緣也可能有風險，鋁罐本身並不會像鐵罐一樣生鐵鏽。',
  },
  {
    type: 1, title: '塑膠變小了，危害卻沒有消失', icon: '🧴',
    impact: '中央社報導，塑膠微粒進入海洋後可能吸附污染物，並被浮游生物、魚類與海洋哺乳類吞食；難以消化的微粒會影響生長與繁殖。塑膠垃圾變成肉眼難見的碎片，並不代表它離開了海洋。',
    action: '出門自備水壺，空瓶帶回回收，減少一次性塑膠容器。',
    source: '中央社 · 2017-08-03 · 繁體中文',
    headline: '塑膠微粒造成的影響 一次看懂',
    url: 'https://www.cna.com.tw/news/asoc/201708030176.aspx',
    note: '報導談的是微塑膠的整體影響，遊戲瓶子象徵塑膠污染；不是每個瓶子都已造成同樣的傷害。',
  },
  ...seaStories,
];
function showCatchLesson(cargo) {
  const type = types.findIndex(item => item.name === cargo.name);
  if (type < 0) return false;
  if (discoveredTypes.has(type)) {
    toast(`${cargo.name} +${cargo.points} 分 · ${catchStories.find(item => item.type === type).action}`);
    return false;
  }
  discoveredTypes.add(type);
  const story = catchStories.find(item => item.type === type);
  $('lesson-icon').textContent = cargo.icon;
  $('lesson-badge').textContent = `航程新發現 · ${cargo.name} · +${cargo.points} 分`;
  $('lesson-title').textContent = story.title;
  $('lesson-impact').textContent = shortImpacts[type];
  $('lesson-action').textContent = story.action;
  state = 'learning';
  hud();
  $('catch-lesson').showModal();
  $('lesson-continue').focus();
  return true;
}
function closeCatchLesson() {
  if (state !== 'learning') return;
  $('catch-lesson').close();
  last = 0;
  state = 'playing';
  if (score >= levels[level].target) finish();
  else { hud(); if (document.hidden) pause(); else $('cast').focus(); }
}
function renderJournal(type) {
  const story = catchStories.find(item => item.type === type);
  $('journal-badge').textContent = discoveredTypes.has(type) ? '已在本趟航程發現' : '尚未打撈 · 可以先閱讀';
  $('journal-story-title').textContent = `${story.icon} ${story.title}`;
  for (const key of ['impact', 'action', 'source', 'note']) $('journal-' + key).textContent = story[key];
  $('journal-link').textContent = `${story.headline}（另開分頁）`;
  $('journal-link').href = story.url;
  for (const button of $('journal-tabs').children) button.setAttribute('aria-pressed', String(Number(button.dataset.type) === type));
}
function openJournal() {
  if (['learning', 'quiz', 'journal'].includes(state)) return;
  journalReturnState = state; journalFocus = document.activeElement;
  state = 'journal'; hud();
  $('journal-progress').textContent = `本趟航程已打撈 ${discoveredTypes.size} / ${types.length} 種海廢。閱讀不會消耗遊戲時間；未打撈的種類也能先了解。重新出航會重設發現紀錄。`;
  $('journal-tabs').replaceChildren();
  types.forEach((type, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'journal-tab'; button.dataset.type = index;
    button.textContent = `${type.icon} ${type.name}${discoveredTypes.has(index) ? ' ✓' : ''}`;
    button.addEventListener('click', () => renderJournal(index));
    $('journal-tabs').append(button);
  });
  renderJournal(discoveredTypes.values().next().value ?? 0);
  $('journal').showModal(); $('journal-close').focus();
}
function closeJournal() {
  if (state !== 'journal') return;
  $('journal').close(); state = journalReturnState; last = 0;
  if (document.hidden && state === 'playing') pause();
  hud(); journalFocus?.focus();
}
function answerQuiz(index) {
  if (state !== 'quiz' || quizAnswered) return;
  quizAnswered = true;
  const question = questions[level];
  learnedChoices.add(level);
  for (const [option, button] of [...$('quiz-options').children].entries()) {
    button.disabled = true;
    if (option === question.answer) {button.classList.add('correct'); button.textContent += ' ✓ 建議做法';}
    else if (option === index) {button.classList.add('incorrect'); button.textContent += ' · 你的選擇';}
  }
  $('quiz-feedback').textContent = `${index === question.answer ? '這是一個照顧海洋的選擇！' : '一起換個做法，下次就知道了。'} ${question.explanation}`;
  $('quiz-feedback').hidden = false;
  $('quiz-continue').disabled = false; $('quiz-continue').focus();
}
function completeQuiz() {
  if (state !== 'quiz' || !quizAnswered) return;
  $('quiz').close(); showResults(); $('start').focus();
}
function resetJourney() {
  level = 0; totalCaught = 0; discoveredTypes.clear(); learnedChoices.clear();
  startLevel();
}
const goodDeeds = [
  '做好事不必等大事，從帶走一件垃圾開始。',
  '少用一個塑膠袋，多留一片乾淨海。',
  '自備水壺與購物袋，讓減塑成為日常。',
  '把垃圾帶走，把美好留給下一個人。',
  '給海洋朋友一個家，不給牠們一袋垃圾。',
  '一句謝謝、一次幫忙，都是讓世界變好的小事。',
  '保護海洋，也可以從把自己的垃圾帶回家開始。',
  '謝謝每一位清潔人員與志工，讓善意繼續傳下去。',
  '不必一次做到完美，今天多做一點就很好。',
];
function encourage(index) { $('good-deed').textContent = goodDeeds[index % goodDeeds.length]; }
function tone(frequency, duration = .1, type = 'sine') {
  if (!sound) return;
  try {
    ensureAudio();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
  } catch { /* Sound is optional on browsers without Web Audio. */ }
}
function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); toastUntil = clock + 2.2; }
function populate() {
  objects = [];
  // Shuffle a balanced mix, then sample free positions throughout the sea.
  const count = W <= 650 ? 20 : 21;
  const mix = Array.from({length: count}, (_, i) => types[i % types.length]);
  // Each sea features its story's waste while retaining a playable mix.
  for (let i = 0; i < 4; i++) mix[i] = types[seaStories[level].type];
  for (let i = mix.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mix[i], mix[j]] = [mix[j], mix[i]];
  }
  // Reserve space for the bulky items first, then fill gaps with light waste.
  mix.sort((a, b) => b.radius - a.radius);
  for (const type of mix) {
    for (let attempt = 0; attempt < 2000; attempt++) {
      const x = 30 + type.radius + Math.random() * (W - 60 - type.radius * 2);
      const y = 255 + Math.random() * (H - 65 - type.radius - 255);
      if (Math.abs(Math.atan2(x - origin.x, y - origin.y)) > 1.1) continue;
      if (objects.some(o => Math.hypot(x - o.x, y - o.y) < type.radius + o.radius + 14)) continue;
      objects.push({...type, x, y, rotation: (Math.random() - .5) * 1.1, active: true});
      break;
    }
  }
  fish = Array.from({length: 3 + level}, (_, i) => ({x: 70 + i * (W - 140) / (2 + level), y: 325 + i % 3 * 100, radius: 24, direction: i % 2 ? -1 : 1, active: true, isFish: true, icon: '🐟', weight: .8, points: -60, name: '小魚'}));
}
function hud() {
  updateMusicVolume();
  $('care-caught').textContent = caught;
  $('care-learned').textContent = discoveredTypes.size;
  $('care-released').textContent = releasedFish;
  $('journal-count').textContent = `${discoveredTypes.size}/${types.length}`;
  $('journal-open').disabled = ['learning', 'quiz', 'journal'].includes(state);
  $('cleanup-status').textContent = `本關打撈 ${caught} / ${objects.length} 件`;
  $('area').textContent = `${String(level + 1).padStart(2, '0')} · ${levels[level].name}`;
  $('score').textContent = score; $('target').textContent = levels[level].target;
  $('time').innerHTML = `${Math.ceil(remaining)}<span class="unit">秒</span>`;
  $('time').parentElement.classList.toggle('urgent', remaining <= 15);
  $('progress').style.width = `${Math.min(100, score / levels[level].target * 100)}%`;
  $('cast').disabled = state !== 'playing' || hook.mode !== 'swing';
  $('pause').disabled = !['playing', 'paused'].includes(state);
  $('hook-status').textContent = hook.mode === 'swing' ? '抓準方向，放出吊鉤' : hook.mode === 'out' ? '吊鉤出發！' : hook.cargo ? `正在拉回${hook.cargo.name}…` : '收回吊鉤中…';
}
function startLevel() {
  if ($('catch-lesson').open) $('catch-lesson').close();
  recovery = 0; last = 0;
  score = 0; remaining = levels[level].time; caught = 0; releasedFish = 0;
  hook = {mode: 'swing', angle: 0, length: 42, cargo: null};
  particles = []; floats = []; populate(); state = 'playing';
  startMusic();
  $('overlay').hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', '暫停遊戲');
  $('toast').classList.remove('show'); encourage(level); hud(); tone(520, .15);
}
function showOverlay(badge, title, copy, button, note) {
  $('badge').textContent = badge; $('overlay-title').innerHTML = title;
  $('overlay-copy').textContent = copy; $('start').textContent = button;
  $('overlay-note').textContent = note; $('overlay').hidden = false; hud();
  $('result-extras').hidden = !['passed', 'won', 'lost'].includes(state);
}
function finish() {
  if (state !== 'playing') return;
  state = 'quiz'; quizAnswered = false; hud();
  const question = questions[level];
  $('quiz-badge').textContent = `${levels[level].name} · 海洋行動練習`;
  $('quiz-question').textContent = question.question;
  $('quiz-feedback').hidden = true; $('quiz-feedback').textContent = '';
  $('quiz-continue').disabled = true;
  $('quiz-options').replaceChildren();
  question.options.forEach((text, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'quiz-option'; button.textContent = text;
    button.addEventListener('click', () => answerQuiz(index));
    $('quiz-options').append(button);
  });
  $('quiz').showModal(); $('quiz-options').firstElementChild.focus();
}
function showResults() {
  const passed = score >= levels[level].target;
  totalCaught += caught;
  $('learning-summary').textContent = `已練習 ${learnedChoices.size} / ${levels.length} 個海洋行動。本關帶走的知識：${questions[level].takeaway}`;
  state = passed ? (level === 2 ? 'won' : 'passed') : 'lost';
  tone(passed ? 780 : 180, .3);
  showOverlay(passed ? '任務完成 · 謝謝你，船長！' : '每一次嘗試，都有意義', passed ? (level === 2 ? '把這份善意，<br>帶進生活裡。' : '這片海，<br>又乾淨了一點。') : caught ? '你帶走的垃圾，<br>就是一份改變。' : '願意開始，<br>就是好的第一步。',
    state === 'won' ? `這次航程累計清除了 ${totalCaught} 件遊戲垃圾。選一件今天想做的小事，讓善意繼續。` : passed ? '每一件都值得被帶離海洋。選一件生活小事，再前往下一片海域。' : `得到 ${score} 分，目標 ${levels[level].target} 分。沒過關也不會抹去你的努力。`,
    state === 'passed' ? '前往下一海域' : state === 'won' ? '再來一趟' : '再試一次',
    '');
}
function primaryAction() {
  if (state === 'playing') cast();
  else if (state === 'learning') closeCatchLesson();
  else if (state === 'paused') pause();
  else if (state === 'won' || state === 'ready') resetJourney();
  else if (state === 'passed' || state === 'lost') {if (state === 'passed') level++; startLevel();}
}
function cast() {
  if (state !== 'playing' || hook.mode !== 'swing') return;
  hook.mode = 'out'; tone(330, .1, 'triangle'); hud();
}
function pause() {
  if (state === 'playing') {
    state = 'paused'; showOverlay('稍作休息', '海洋等你<br>回來。', '時間已暫停，準備好後繼續清海。', '繼續打撈', '按 P 或空白鍵也能繼續');
    $('pause').textContent = '▶'; $('pause').setAttribute('aria-label', '繼續遊戲');
  } else if (state === 'paused') {
    state = 'playing'; $('overlay').hidden = true; $('pause').textContent = 'Ⅱ'; $('pause').setAttribute('aria-label', '暫停遊戲'); hud();
  }
}
function tip() {return {x: origin.x + Math.sin(hook.angle) * hook.length, y: origin.y + Math.cos(hook.angle) * hook.length};}
function update(dt) {
  clock += dt;
  const cleanFraction = objects.length ? caught / objects.length : 0;
  recovery += (cleanFraction - recovery) * Math.min(1, dt * 2);
  if (clock > toastUntil) $('toast').classList.remove('show');
  particles = particles.filter(p => (p.life -= dt) > 0);
  particles.forEach(p => {p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 110 * dt;});
  floats = floats.filter(p => (p.life -= dt) > 0); floats.forEach(p => p.y -= 30 * dt);
  if (state !== 'playing') return;
  remaining = Math.max(0, remaining - dt);
  if (remaining === 0) { finish(); return; }
  fish.forEach(f => {
    if (!f.active) return;
    f.x += f.direction * (25 + level * 6) * dt;
    if (f.x > W - 50 || f.x < 50) f.direction *= -1;
  });
  if (hook.mode === 'swing') hook.angle = Math.sin(clock * levels[level].speed) * 1.15;
  if (hook.mode === 'out') {
    // Sweep each movement segment to avoid missing small objects on slow frames.
    const before = tip(); hook.length += 420 * dt; const after = tip();
    const dx = after.x - before.x, dy = after.y - before.y, len2 = dx * dx + dy * dy;
    const hit = [...objects, ...fish].filter(o => o.active).map(o => {
      const t = Math.max(0, Math.min(1, ((o.x - before.x) * dx + (o.y - before.y) * dy) / (len2 || 1)));
      return {o, t, distance: Math.hypot(o.x - before.x - dx * t, o.y - before.y - dy * t)};
    }).filter(h => h.distance < h.o.radius + 9).sort((a,b) => a.t - b.t)[0];
    if (hit) {hook.cargo = hit.o; hit.o.active = false; hook.mode = 'back'; tone(240, .12);}
    else if (after.x < 20 || after.x > W - 20 || after.y > H - 38) hook.mode = 'back';
  } else if (hook.mode === 'back') {
    hook.length -= (hook.cargo ? 270 / hook.cargo.weight : 530) * dt;
    if (hook.length <= 42) {
      hook.length = 42;
      if (hook.cargo) {
        const cargo = hook.cargo;
        score = Math.max(0, score + cargo.points);
        if (cargo.isFish) {releasedFish++; cargo.active = true; cargo.x = origin.x + 170; toast('小魚已安全放回！下次記得避開牠 · 扣 60 分'); tone(170, .2);}
        else {caught++; if (caught % 3 === 0) encourage(level + caught / 3);
          if (cargo.name === types[seaStories[level].type].name) toast(seaStories[level].catchMessage);
          tone(660, .15); floats.push({x: origin.x, y: 190, text: `+${cargo.points}`, life: 1.5});
          for (let i = 0; i < 12; i++) particles.push({x: origin.x, y: 185, vx: (Math.random() - .5) * 160, vy: -Math.random() * 100, life: .8, color: '#ffdb81'});
        }
        hook.cargo = null;
        hook.mode = 'swing';
        if (!cargo.isFish && showCatchLesson(cargo)) return;
        if (score >= levels[level].target) {finish(); return;}
      }
      hook.mode = 'swing';
    }
  }
  hud();
}
function path(points, fill, stroke, width=2) {
  ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
  if (fill) {ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function render() {
  const sky = ctx.createLinearGradient(0,0,0,210); sky.addColorStop(0,'#b3e5e8'); sky.addColorStop(1,'#e1f6ed'); ctx.fillStyle=sky;ctx.fillRect(0,0,W,210);
  ellipse(904,65,33,33,'#ffdd85');
  // Functional game scenery, rendered in the same coordinate space as the hook.
  for (const [x,y,s] of [[200,66,1],[730,50,.65],[1030,114,.55]]) {
    ellipse(x,y,48*s,13*s,'#ffffff8c');ellipse(x-20*s,y-8*s,20*s,19*s,'#ffffff8c');ellipse(x+12*s,y-13*s,27*s,25*s,'#ffffff8c');
  }
  path([[0,176],[120,135],[210,171],[290,148],[370,195],[0,210]],'#7bb8b9');
  path([[850,200],[955,164],[1100,183],[1100,220]],'#91c6c3');
  const sea=ctx.createLinearGradient(0,200,0,H);sea.addColorStop(0,`hsl(${184 + recovery * 4} 70% ${30 + recovery * 14}%)`);sea.addColorStop(.4,`hsl(190 72% ${23 + recovery * 12}%)`);sea.addColorStop(1,`hsl(197 73% ${16 + recovery * 9}%)`);ctx.fillStyle=sea;ctx.fillRect(0,200,W,H-200);
  ctx.save();ctx.globalAlpha=.025 + recovery * .14;
  for(let i=0;i<5;i++) path([[110+i*220,200],[190+i*220,200],[340+i*220,H],[10+i*220,H]],'#fff');ctx.restore();
  ctx.beginPath();ctx.moveTo(0,204);
  for(let x=0;x<=W;x+=10) ctx.lineTo(x,204+Math.sin(x*.025+clock)*4);ctx.strokeStyle='#86e4dd';ctx.lineWidth=4;ctx.stroke();
  for(let i=0;i<28;i++){const x=(i*127+36)%W,y=230+((i*71-clock*(8+i%4)*3)%390+390)%390;ctx.beginPath();ctx.arc(x,y,2+i%3,0,Math.PI*2);ctx.strokeStyle='#8bd5d32e';ctx.lineWidth=1;ctx.stroke();}
  path([[0,620],[95,600],[225,612],[370,595],[530,618],[750,602],[925,615],[1100,591],[1100,650],[0,650]],'#246a70');
  for(let i=0;i<12;i++){const x=40+i*95;ctx.beginPath();ctx.moveTo(x,630);ctx.quadraticCurveTo(x-20+Math.sin(clock+i)*8,589,x+Math.sin(clock+i)*13,570-i%3*12);ctx.strokeStyle=i%2?'#32958a':'#267f79';ctx.lineWidth=6;ctx.lineCap='round';ctx.stroke();}
  // A gradual visual metaphor, not a measurement of real ecosystem recovery.
  for (let i = 0; i < 7; i++) {
    const x = 55 + i * (W - 110) / 6, y = 632 - i % 2 * 12;
    ctx.strokeStyle = `hsl(${i % 2 ? 24 : 350} ${12 + recovery * 64}% ${30 + recovery * 30}%)`;
    ctx.lineWidth = 7; ctx.lineCap = 'round';
    const height = 18 + recovery * 30;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - height);
    ctx.moveTo(x, y - height * .35); ctx.lineTo(x - 12, y - height * .65); ctx.lineTo(x - 14, y - height);
    ctx.moveTo(x, y - height * .55); ctx.lineTo(x + 14, y - height * .8); ctx.lineTo(x + 17, y - height * 1.15); ctx.stroke();
  }
  ctx.textAlign='center';ctx.textBaseline='middle';
  objects.forEach(o=>{if(!o.active)return;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rotation);ellipse(0,20,o.radius*.7,5,'#003e5633');ctx.font=`${o.radius*1.8}px "Segoe UI Emoji", sans-serif`;ctx.fillText(o.icon,0,0);ctx.restore();});
  fish.forEach(f=>{if(!f.active)return;ctx.save();ctx.translate(f.x,f.y+Math.sin(clock*2+f.y)*5);ctx.scale(f.direction === 1 ? -1:1,1);ctx.font='39px "Segoe UI Emoji", sans-serif';ctx.fillText('🐟',0,0);ctx.restore();});
  // Boat, crane, and sailor.
  ctx.save();ctx.translate(origin.x - 550,Math.sin(clock*1.4)*2);
  ellipse(550,206,100,7,'#053e5740');
  path([[443,177],[650,177],[626,205],[478,205]],'#e6944d','#805743',2);
  path([[458,177],[639,177],[633,186],[465,186]],'#ffce75');
  path([[472,170],[472,122],[516,122],[534,170]],'#fff2ce');
  ctx.fillStyle='#276b7b';ctx.fillRect(480,131,27,22);ctx.fillStyle='#e6a855';ctx.fillRect(466,118,57,7);
  ctx.strokeStyle='#44616a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(605,174);ctx.lineTo(605,91);ctx.lineTo(550,91);ctx.lineTo(550,156);ctx.stroke();
  ellipse(550,151,9,9,'#f8cb64');ellipse(565,137,10,11,'#ecbc8c');
  ctx.fillStyle='#f7f4dd';ctx.fillRect(554,146,22,25);ctx.fillStyle='#07394b';ctx.fillRect(554,166,8,12);ctx.fillRect(568,166,8,12);
  ellipse(565,127,15,4,'#ffd76e');path([[555,126],[558,115],[572,115],[576,126]],'#ffcc59');
  ctx.restore();
  const p=tip();ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(p.x,p.y);ctx.lineWidth=2;ctx.strokeStyle='#f3e5b7';ctx.stroke();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-hook.angle);ctx.strokeStyle='#eef6e8';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(0,8);ctx.moveTo(-13,2);ctx.quadraticCurveTo(-13,22,0,18);ctx.quadraticCurveTo(13,22,13,2);ctx.stroke();ctx.restore();
  if(hook.cargo){ctx.font=`${hook.cargo.radius?hook.cargo.radius*1.8:40}px "Segoe UI Emoji", sans-serif`;ctx.fillText(hook.cargo.icon,p.x,p.y+22);}
  particles.forEach(p=>{ctx.globalAlpha=p.life;ellipse(p.x,p.y,3,3,p.color);});ctx.globalAlpha=1;
  floats.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life);ctx.font='bold 28px sans-serif';ctx.fillStyle='#ffdd80';ctx.fillText(p.text,p.x,p.y);});ctx.globalAlpha=1;
  ctx.textAlign='left';ctx.font='11px sans-serif';ctx.fillStyle='#b4e3dd77';ctx.fillText('水深 18 m',24,608);ctx.textAlign='right';ctx.fillText('保持海洋自由呼吸',W-24,608);
}
function frame(timestamp) {
  const dt = last ? Math.min((timestamp-last)/1000,.05) : 0;last=timestamp;
  update(dt);render();requestAnimationFrame(frame);
}
function resize() {
  const nextWidth = window.innerWidth <= 600 ? 650 : 1100;
  if (nextWidth !== W) {
    // Preserve the round on rotation, but pause so the player can reorient.
    if (state === 'playing') pause();
    for (const item of [...objects, ...fish, ...particles, ...floats]) item.x *= nextWidth / W;
    W = nextWidth; origin.x = W / 2;
    // Return an in-flight hook without losing its cargo after a layout change.
    if (hook.mode !== 'swing') {hook.mode = 'back';hook.angle = 0;}
  }
  const bounds = canvas.parentElement.getBoundingClientRect();
  const displayWidth = Math.max(1, Math.min(bounds.width, bounds.height * W / H));
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayWidth * H / W}px`;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const scale = Math.min(2, displayWidth * dpr / W);
  canvas.width=Math.round(W*scale);canvas.height=Math.round(H*scale);ctx.setTransform(scale,0,0,scale,0,0);
}
$('start').addEventListener('click',primaryAction);$('cast').addEventListener('click',cast);
$('music').addEventListener('click', () => {
  musicEnabled = !musicEnabled;
  $('music').textContent = `音樂 ${musicEnabled ? 'ON' : 'OFF'}`;
  $('music').setAttribute('aria-pressed', String(musicEnabled));
  $('music').setAttribute('aria-label', musicEnabled ? '關閉背景音樂' : '開啟背景音樂');
  if (musicEnabled) startMusic(); else stopMusic();
});
$('music-volume').addEventListener('input', event => { musicVolume = Number(event.target.value) / 100; updateMusicVolume(); });
$('lesson-continue').addEventListener('click', closeCatchLesson);
$('journal-open').addEventListener('click', openJournal);
$('journal-close').addEventListener('click', closeJournal);
$('journal').addEventListener('cancel', event => {event.preventDefault(); closeJournal();});
$('quiz-continue').addEventListener('click', completeQuiz);
$('quiz').addEventListener('cancel', event => {event.preventDefault(); if (quizAnswered) completeQuiz();});
$('kind-action-next').addEventListener('click', () => {
  kindActionIndex = (kindActionIndex + 1) % kindActions.length;
  $('kind-action-text').textContent = kindActions[kindActionIndex];
});
$('catch-lesson').addEventListener('cancel', event => {
  event.preventDefault(); closeCatchLesson();
});
canvas.addEventListener('pointerdown', event => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault();cast();
});$('pause').addEventListener('click',pause);
$('restart').addEventListener('click', resetJourney);
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=`音效 ${sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'關閉音效':'開啟音效');tone(600,.12);});
document.addEventListener('keydown',event=>{
  if ($('personal-action').open) return;
  if(event.code==='Space' && !event.repeat && !['BUTTON','A','INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();primaryAction();}
  if(event.code==='KeyP' && !event.repeat) pause();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) {if(state==='playing')pause();stopMusic();}
  else if (state !== 'ready') startMusic();
  last=0;
});
window.addEventListener('resize',resize);
new ResizeObserver(resize).observe(canvas.parentElement);
populate();resize();hud();requestAnimationFrame(frame);

// Personal actions pause the round and never change the cleanup score.
let actionReturnState, actionFocus, actionRequest;
function openPersonalAction() {
  if (['learning', 'quiz', 'journal', 'action'].includes(state)) return;
  actionReturnState = state; actionFocus = document.activeElement; state = 'action'; hud();
  $('action-context').textContent = `本趟航程已打撈 ${totalCaught} 件海廢、認識 ${discoveredTypes.size} 種海廢。填寫期間遊戲暫停。`;
  $('personal-action').showModal();
}
function closePersonalAction() {
  actionRequest?.abort(); $('personal-action').close(); state = actionReturnState; last = 0;
  if (document.hidden && state === 'playing') pause();
  hud(); actionFocus?.focus();
}
for (const container of [document.querySelector('.top-actions'), document.querySelector('.kindness')]) {
  const button = document.createElement('button'); button.type = 'button';
  button.className = 'icon-button'; button.textContent = '🌊 個人行動 AI';
  button.setAttribute('aria-haspopup', 'dialog'); button.addEventListener('click', openPersonalAction); container.append(button);
}
$('action-close').addEventListener('click', closePersonalAction);
$('personal-action').addEventListener('cancel', event => {event.preventDefault(); closePersonalAction();});
$('action-form').addEventListener('submit', async event => {
  event.preventDefault(); actionRequest?.abort();
  const controller = new AbortController(); actionRequest = controller;
  const timeout = setTimeout(() => controller.abort(), 40000);
  $('action-generate').disabled = true; $('action-status').textContent = '正在為你安排今天做得到的行動…';
  $('action-result').hidden = true;
  try {
    const profile = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('https://twswapi.cloudns.nz:3005/api/personal-action', {method: 'POST', headers: {'Content-Type': 'application/json'}, signal: controller.signal,
      body: JSON.stringify({...profile, caught: totalCaught, discovered: [...discoveredTypes].map(i => types[i].name)})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '暫時無法產生行動，請稍後再試。');
    if (typeof result.plan !== 'string' || !result.plan.trim()) throw new Error('沒有收到完整建議，請再試一次。');
    $('action-source').textContent = result.demo ? '示範任務 · 尚未啟用 AI' : 'OpenAI 產生 · 個人海洋行動';
    $('action-plan').textContent = result.plan;
    $('action-status').textContent = result.demo ? '後端尚未設定 API 金鑰，以下為預先準備的示範任務。' : '這是依你的習慣與航程成果產生的建議。完成後再回來打勾！';
    $('action-record').textContent = ''; $('action-complete').disabled = false; $('action-result').hidden = false;
  } catch (error) {
    if ($('personal-action').open) $('action-status').textContent = error.name === 'AbortError' ? '請求已取消或逾時，請再試一次。' : error instanceof SyntaxError || error instanceof TypeError ? '無法連線到 AI 後端，請確認 https://twswapi.cloudns.nz:3005 已啟動，以及目前網站已被允許連線。' : error.message;
  } finally {
    clearTimeout(timeout); if (actionRequest === controller) {$('action-generate').disabled = false; actionRequest = null;}
  }
});
$('action-complete').addEventListener('click', () => {
  $('action-complete').disabled = true;
  $('action-record').textContent = '今天又為海洋做了一件好事，謝謝你！';
  try {localStorage.setItem('ocean-personal-action', JSON.stringify({plan: $('action-plan').textContent, completedAt: new Date().toISOString()}));}
  catch { $('action-record').textContent += '（此瀏覽器無法保存紀錄）'; }
});
try {
  const saved = JSON.parse(localStorage.getItem('ocean-personal-action'));
  if (saved && typeof saved.plan === 'string' && saved.completedAt) {
    $('action-plan').textContent = saved.plan; $('action-source').textContent = '上次完成的行動';
    $('action-record').textContent = '你已完成這個行動，也可以再產生新的任務。'; $('action-complete').disabled = true; $('action-result').hidden = false;
  }
} catch {}
