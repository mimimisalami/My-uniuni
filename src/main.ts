import * as THREE from 'three';
import { OUTFITS, SETTINGS, WORLDS, type OutfitId, type WorldId } from './config';
import { newId, resetData, resetTimer, saveState, secondsRemaining, state, toggleTimer, type Column } from './state';
import { AvatarPreview, Universe, type Hotspot, type HotspotAction } from './world';
import './style.css';

const icons = {
  star: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.3"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" stroke="currentColor" stroke-width="1.3"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 10 9-7 9 7M6 9v11h12V9M10 20v-7h4v7" stroke="currentColor" stroke-width="1.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" stroke-width="1.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" stroke="currentColor" stroke-width="1.4"/></svg>',
  diamond: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 8 10-8 10L4 12 12 2Zm0 0v20M4 12h16" stroke="currentColor" stroke-width="1.3"/></svg>',
  shirt: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 4-5 3 2 5 3-1v9h8v-9l3 1 2-5-5-3c0 4-8 4-8 0Z" stroke="currentColor" stroke-width="1.4"/></svg>',
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <canvas id="universe" aria-label="Interactive three-dimensional sky city. Use WASD or arrow keys to move after entering."></canvas>
  <div class="scene-vignette" aria-hidden="true"></div>
  <header class="topbar">
    <a class="brand" href="#" aria-label="Aether home">${icons.star}<span>AETHER<small>A PERSONAL UNIVERSE</small></span></a>
    <div class="topbar-right"><span class="prototype-tag"><i></i> INTERACTIVE DEMO <span> / 0.1</span></span>
    <button class="icon-button help-button" aria-label="Open controls and help">?</button></div>
  </header>

  <section class="welcome" aria-labelledby="welcome-title">
    <div class="welcome-content">
      <p class="eyebrow"><span class="fine-line"></span> YOUR OWN LITTLE INFINITY</p>
      <h1 id="welcome-title">A world<br>to call <em>yours.</em></h1>
      <p class="welcome-copy">A quiet place above the ordinary.<br>Follow your curiosity. Bring an idea to life.<br>Come back to yourself.</p>
      <button class="button primary enter-button">Enter My Universe <span>${icons.arrow}</span></button>
      <p class="welcome-footnote"><span class="tiny-orbit">✧</span> No account. No rush. Just you.</p>
      <div class="welcome-worlds"><span>01 <b>Explore</b></span><span>02 <b>Create</b></span><span>03 <b>Become</b></span></div>
    </div>
    <div class="postcard"><span class="eyebrow">YOUR FIRST DESTINATION</span><h2>The Celestial Hub</h2><p>Somewhere between the sky and possibility.</p><div><span>MARBLE · SUNLIGHT · OPEN SKY</span>${icons.compass}</div></div>
    <div class="welcome-bottom"><span>A SMALL UNIVERSE. AN OPEN-ENDED STORY.</span><span>DESIGNED FOR A MOMENT OF POSSIBILITY</span></div>
  </section>

  <main class="experience" hidden>
    <section class="world-heading" aria-live="polite"><p class="eyebrow"><span id="world-number">00</span><span class="fine-line"></span> YOUR UNIVERSE</p><h1 id="world-name">The Celestial Hub</h1><p id="world-purpose">A place to return to yourself.</p></section>
    <nav class="world-nav" aria-label="Universe navigation">
      <button class="button glass home-button" hidden>${icons.home}<span>Back to Hub</span></button>
      <button class="button glass work-button" hidden>${icons.book}<span>Open workspace</span></button>
      <button class="button glass atlas-button" aria-label="Atlas / Quick travel">${icons.compass}<span>Atlas <span class="nav-detail">/ Quick travel</span></span></button>
    </nav>
    <div id="hotspot-labels"></div>
    <div class="bottom-hud">
      <div class="location-mark"><span class="compass-rose">N<br>◇</span><span>HERE, YOU HAVE SPACE.<small id="location-caption">THE CELESTIAL HUB · SKY TERRACE</small></span></div>
      <button class="interact-button" hidden><kbd>E</kbd><span>Interact</span>${icons.arrow}</button>
      <button class="control-hint" aria-label="Show movement controls"><span class="key-cluster">W<br>A S D</span><span>Move freely<small>WASD / ARROW KEYS · E TO INTERACT</small></span></button>
    </div>
    <div class="touch-controls" aria-label="Movement controls">
      <button data-move="up" aria-label="Move forward">↑</button><button data-move="left" aria-label="Move left">←</button><span></span><button data-move="right" aria-label="Move right">→</button><button data-move="down" aria-label="Move backward">↓</button>
    </div>
    <div class="world-caption" aria-hidden="true"><span>✦</span> CURIOSITY IS A GOOD DIRECTION.</div>
  </main>
  <div class="transition" aria-hidden="true"><div>${icons.star}<span id="transition-name">The Celestial Hub</span><small>A LITTLE CHANGE OF PERSPECTIVE</small></div></div>
  <div class="modal-backdrop" hidden>
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <div class="modal-header"><div><p class="eyebrow" id="modal-kicker"></p><h2 id="modal-title"></h2></div><button class="icon-button close-modal" aria-label="Close dialog">${icons.close}</button></div>
      <div id="modal-content"></div>
    </section>
  </div>
  <div class="toast" role="status" aria-live="polite"></div>
  <div class="graphics-error" hidden><div>${icons.star}<h1>A little pause in the universe.</h1><p>Your browser could not start the 3D scene. Enable hardware acceleration or try a current version of Chrome, Firefox, or Safari.</p><button class="button primary" id="reload-graphics">Try again</button></div></div>
`;

const $ = <T extends Element = HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
const $$ = <T extends Element = HTMLElement>(selector: string): T[] => [...document.querySelectorAll<T>(selector)];
let universe: Universe;
let preview: AvatarPreview | null = null;
let selectedOutfit = state.outfit;
let currentWorld: WorldId = 'hub';
let entered = false;
let travelling = false;
let activePanel = '';
let previousFocus: HTMLElement | null = null;
let nearest: Hotspot | null = null;
let toastTimeout = 0;
let timerInterval = 0;
let labelElements: HTMLButtonElement[] = [];
let storageWarningShown = false;

function toast(message: string) {
  $('.toast').textContent = message; $('.toast').classList.add('visible');
  clearTimeout(toastTimeout); toastTimeout = window.setTimeout(() => $('.toast').classList.remove('visible'), 3600);
}

function showGraphicsError() { $('.graphics-error').hidden = false; }
try {
  universe = new Universe($('#universe'), state.outfit);
  universe.onInteract = interact;
  universe.onNear = spot => {
    nearest = spot;
    const button = $('.interact-button'); button.hidden = !spot;
    if (spot) button.querySelector('span')!.textContent = spot.title;
  };
  universe.onFrame = projectLabels;
  makeLabels();
} catch (error) { console.error('Unable to initialize the 3D renderer', error); showGraphicsError(); }
document.addEventListener('aether:graphics-lost', showGraphicsError);
$('#reload-graphics').addEventListener('click', () => location.reload());

function makeLabels() {
  $('#hotspot-labels').replaceChildren(); labelElements = [];
  for (const spot of universe.hotspots) {
    const button = document.createElement('button');
    button.className = 'hotspot'; button.style.setProperty('--spot-color', spot.color);
    const symbol = spot.action === 'observatory' || spot.action === 'focus' ? icons.book : spot.action === 'wardrobe' ? icons.shirt : icons.diamond;
    button.innerHTML = `<span class="hotspot-icon">${symbol}</span><span class="hotspot-title">${spot.title}</span><span class="hotspot-subtitle">${spot.subtitle}</span><span class="hotspot-action">ENTER ${icons.arrow}</span>`;
    button.setAttribute('aria-label', `Go to ${spot.title}`);
    // Labels are an accessible direct-travel alternative to walking to a portal.
    button.addEventListener('click', () => interact(spot.action));
    $('#hotspot-labels').append(button); labelElements.push(button);
  }
}

function projectLabels(spots: Hotspot[], camera: THREE.Camera) {
  if (!entered) return;
  spots.forEach((spot, i) => {
    const p = spot.position.clone(); p.y = spot.labelHeight; p.project(camera);
    const button = labelElements[i]; if (!button) return;
    const visible = p.z < 1 && p.z > -1 && Math.abs(p.x) < 1.15 && Math.abs(p.y) < 1.15;
    button.hidden = !visible;
    button.style.left = `${(p.x * .5 + .5) * innerWidth}px`;
    button.style.top = `${(-p.y * .5 + .5) * innerHeight}px`;
    button.classList.toggle('near', nearest === spot);
  });
}

$('.enter-button').addEventListener('click', () => {
  entered = true; universe.active = true; universe.setPaused(false);
  universe.camera.position.set(0, 18.5, 14 + (innerWidth < 700 ? 30 : 25));
  universe.camera.lookAt(0, 0, 3);
  $('.welcome').hidden = true; $('.experience').hidden = false; document.body.classList.add('entered');
  $('.atlas-button').focus();
  if (!localStorageTest()) toast('Browser storage is unavailable. Changes will last for this visit only.');
});

function localStorageTest() {
  try { const key = 'aether-storage-check'; localStorage.setItem(key, '1'); localStorage.removeItem(key); return true; } catch { return false; }
}

async function travel(world: WorldId) {
  if (travelling) return;
  closePanel();
  if (world === currentWorld) { toast(`You are already in ${WORLDS[world].short}.`); return; }
  travelling = true; universe.setPaused(true);
  $('#transition-name').textContent = WORLDS[world].name;
  $('.transition').classList.add('visible');
  await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 430));
  currentWorld = world; universe.loadWorld(world); makeLabels();
  $('#world-name').textContent = WORLDS[world].name;
  $('#world-number').textContent = WORLDS[world].number;
  $('#world-purpose').textContent = WORLDS[world].purpose;
  $('#location-caption').textContent = `${WORLDS[world].name.toUpperCase()} · SKY TERRACE`;
  $('.home-button').hidden = world === 'hub'; $('.work-button').hidden = world === 'hub';
  $('.work-button span').textContent = world === 'observatory' ? 'Focus + Notes' : 'Workflow Board';
  document.body.dataset.world = world;
  await new Promise(resolve => setTimeout(resolve, 220));
  $('.transition').classList.remove('visible'); universe.setPaused(false); travelling = false;
}

function interact(action: HotspotAction) {
  if (travelling) return;
  if (['hub', 'observatory', 'atelier'].includes(action)) void travel(action as WorldId);
  if (action === 'wardrobe') openWardrobe();
  if (action === 'focus') openFocus();
  if (action === 'board') openBoard();
}
$('.interact-button').addEventListener('click', () => { if (nearest) interact(nearest.action); });
$('.home-button').addEventListener('click', () => void travel('hub'));
$('.work-button').addEventListener('click', () => currentWorld === 'observatory' ? openFocus() : openBoard());
$('.brand').addEventListener('click', e => { e.preventDefault(); if (entered) void travel('hub'); });

function openPanel(id: string, kicker: string, title: string, html: string) {
  if (!activePanel) previousFocus = document.activeElement as HTMLElement;
  clearInterval(timerInterval);
  if (preview) preview.visible = false;
  activePanel = id;
  $('.modal').className = `modal modal-${id}`;
  $('#modal-kicker').textContent = kicker; $('#modal-title').textContent = title;
  $('#modal-content').innerHTML = html;
  $('.modal-backdrop').hidden = false; document.body.classList.add('modal-open');
  $$('.topbar, .welcome, .experience').forEach(el => { el.inert = true; });
  $('.modal').scrollTop = 0;
  universe?.setPaused(true);
  $('.close-modal').focus();
}
function closePanel() {
  if (!activePanel) return;
  activePanel = ''; clearInterval(timerInterval);
  if (preview) preview.visible = false;
  $('.modal-backdrop').hidden = true; document.body.classList.remove('modal-open');
  $$('.topbar, .welcome, .experience').forEach(el => { el.inert = false; });
  universe?.setPaused(!entered || travelling);
  previousFocus?.focus();
}
$('.close-modal').addEventListener('click', closePanel);
$('.modal-backdrop').addEventListener('click', e => { if (e.target === $('.modal-backdrop')) closePanel(); });
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePanel();
  if (e.key === 'Tab' && activePanel) {
    const focusable = $$<HTMLElement>('.modal button:not(:disabled), .modal input, .modal textarea, .modal select, .modal a').filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && (document.activeElement === first || !$('.modal').contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
    if (!e.shiftKey && (document.activeElement === last || !$('.modal').contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
  }
});

function openAtlas() {
  openPanel('atlas', 'THE ATLAS / QUICK TRAVEL', 'Where will curiosity take you?', `
    <p class="panel-intro">Three places. Room for every version of you.</p>
    <div class="destination-list">${(Object.keys(WORLDS) as WorldId[]).map(id => `
      <button class="destination" data-world="${id}" ${id === currentWorld ? 'aria-current="location"' : ''}>
        <span class="destination-visual visual-${id}">${id === 'hub' ? icons.star : id === 'observatory' ? icons.book : icons.diamond}</span>
        <span class="destination-copy"><span class="eyebrow">${WORLDS[id].number} / ${id === currentWorld ? 'YOU ARE HERE' : 'A NEW PERSPECTIVE'}</span><strong>${WORLDS[id].name}</strong><small>${WORLDS[id].purpose}</small></span>${icons.arrow}
      </button>`).join('')}</div>
    <button class="button outlined atlas-wardrobe">${icons.shirt} Wardrobe Atelier ${icons.arrow}</button>
    <p class="panel-footnote">Walk through a portal, or take a little shortcut. Both count.</p>
  `);
  $$('.destination[data-world]').forEach(el => el.addEventListener('click', () => void travel(el.dataset.world as WorldId)));
  $('.atlas-wardrobe').addEventListener('click', async () => {
    if (currentWorld !== 'hub') await travel('hub');
    openWardrobe();
  });
}
$('.atlas-button').addEventListener('click', openAtlas);

function openWardrobe() {
  selectedOutfit = state.outfit;
  openPanel('wardrobe', 'WARDROBE ATELIER / PERSONAL EXPRESSION', 'A different side of you.', `
    <p class="panel-intro">Dress for the world you want to step into.</p>
    <div class="wardrobe-layout"><div class="avatar-stage"><span class="eyebrow">YOUR AVATAR</span><canvas id="avatar-preview" aria-label="Full body 3D preview of the selected outfit"></canvas><span class="stage-caption">AN EXPRESSION, NOT A DEFINITION.</span></div>
    <div class="outfit-list" role="group" aria-label="Outfit presets">${(Object.keys(OUTFITS) as OutfitId[]).map((id, i) => `
      <button class="outfit-option ${id === selectedOutfit ? 'selected' : ''}" aria-pressed="${id === selectedOutfit}" data-outfit="${id}"><span class="outfit-swatch" style="--fabric:${OUTFITS[id].color};--accent:${OUTFITS[id].accent}">${icons.shirt}</span><span><small>LOOK 0${i + 1}</small><strong>${OUTFITS[id].name}</strong><em>${OUTFITS[id].subtitle}</em></span><span class="selection-dot"></span></button>`).join('')}
      <p class="local-note">${icons.shirt} Three original, non-gendered silhouettes.<br>Saved on this browser when you apply.</p>
      <button class="button primary apply-outfit">Apply look ${icons.arrow}</button>
    </div></div>
  `);
  // Reuse one preview context across dialog visits to avoid exhausting WebGL contexts.
  const canvas = $<HTMLCanvasElement>('#avatar-preview');
  if (!preview) {
    try { preview = new AvatarPreview(canvas as HTMLCanvasElement, selectedOutfit); }
    catch { canvas.replaceWith(Object.assign(document.createElement('p'), { textContent: 'Preview unavailable. Apply a look to see it in the world.' })); }
  } else {
    canvas.replaceWith(previewCanvas!); preview.change(selectedOutfit);
  }
  if (preview) { previewCanvas ??= $<HTMLCanvasElement>('#avatar-preview'); preview.visible = true; }
  $$('[data-outfit]').forEach(button => button.addEventListener('click', () => {
    selectedOutfit = button.dataset.outfit as OutfitId;
    $$('[data-outfit]').forEach(el => { el.classList.toggle('selected', el === button); el.setAttribute('aria-pressed', String(el === button)); });
    preview?.change(selectedOutfit);
  }));
  $('.apply-outfit').addEventListener('click', () => {
    state.outfit = selectedOutfit; universe.changeOutfit(selectedOutfit); saveState(); closePanel(); toast(`${OUTFITS[selectedOutfit].name}. A new expression of you.`);
  });
}
let previewCanvas: HTMLCanvasElement | null = null;

function openFocus() {
  openPanel('focus', 'THE OBSERVATORY / A LITTLE ROOM TO THINK', 'Follow a thought.', `
    <p class="panel-intro">Stay with one idea. See where it goes.</p>
    <div class="focus-layout"><div class="timer-card"><p class="eyebrow">A MOMENT OF FOCUS</p><div class="timer-orbit"><span class="orbit-star">✧</span><span id="timer-value" role="timer" aria-label="Focus time remaining">25:00</span><span id="timer-status">ONE THING AT A TIME</span></div>
      <button class="button primary" id="timer-toggle">Start focus</button><button class="text-button" id="timer-reset">Reset to 25 minutes</button><p class="local-note">Your timer keeps time while you explore.<br>No notifications or sound.</p></div>
    <div class="notes-card"><label class="eyebrow" for="note">YOUR FIELD NOTES</label><textarea id="note" maxlength="10000" placeholder="What are you curious about today?&#10;&#10;A question. An observation. The beginning of something…"></textarea>
      <div class="note-save-row"><span id="save-status">Saved on this browser</span><span id="note-count"></span></div>
      <div class="idea-bridge"><span class="bridge-icon">${icons.diamond}</span><div><strong>Knowledge wants somewhere to go.</strong><p>Send this note to your Atelier Idea Inbox.<br>Turn it into a small next step when you’re ready.</p></div></div>
      <button class="button outlined" id="send-idea">Send to Idea Inbox ${icons.arrow}</button>
    </div></div>
    <div class="panel-footer"><span>YOUR NOTES STAY ON THIS DEVICE.</span><button class="text-button" id="visit-atelier">Visit the Atelier →</button></div>
  `);
  const note = $<HTMLTextAreaElement>('#note'); note.value = state.note;
  function updateCount() { $('#note-count').textContent = `${note.value.length.toLocaleString()} / 10,000`; $('#send-idea').toggleAttribute('disabled', !note.value.trim()); }
  updateCount();
  note.addEventListener('input', () => { state.note = note.value; $('#save-status').textContent = saveState() ? 'Saved on this browser' : 'Not saved · browser storage unavailable'; updateCount(); });
  $('#send-idea').addEventListener('click', () => {
    const text = note.value.trim(); if (!text) return;
    if (state.ideas.length >= 100) { toast('Your inbox is full. Convert or remove an idea in the Atelier first.'); return; }
    if (state.ideas.some(idea => idea.text === text)) { toast('This note is already waiting in your Idea Inbox.'); return; }
    state.ideas.push({ id: newId(), text }); saveState(); toast('Idea sent. It’s waiting in your Atelier inbox.');
  });
  $('#timer-toggle').addEventListener('click', () => { toggleTimer(); updateTimer(); });
  $('#timer-reset').addEventListener('click', () => { resetTimer(); updateTimer(); });
  $('#visit-atelier').addEventListener('click', () => void travel('atelier'));
  updateTimer(); timerInterval = window.setInterval(updateTimer, 250);
}

function updateTimer() {
  if (activePanel !== 'focus') return;
  const seconds = secondsRemaining();
  if (seconds === 0 && state.timer.endAt !== null) { state.timer = { remaining: 0, endAt: null }; saveState(); toast('Your focus session is complete. Take a breath.'); }
  $('#timer-value').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  $('#timer-toggle').textContent = state.timer.endAt !== null ? 'Pause focus' : seconds === 0 ? 'Start a new session' : seconds < SETTINGS.focusSeconds ? 'Resume focus' : 'Start focus';
  $('#timer-status').textContent = seconds === 0 ? 'A LITTLE PROGRESS, MADE.' : state.timer.endAt ? 'STAY WITH YOUR CURIOSITY' : seconds < SETTINGS.focusSeconds ? 'TAKE YOUR TIME' : 'ONE THING AT A TIME';
}

const columns: { id: Column; name: string; caption: string }[] = [{ id: 'todo', name: 'To do', caption: 'A beginning' }, { id: 'progress', name: 'In progress', caption: 'Taking shape' }, { id: 'done', name: 'Done', caption: 'A little progress' }];
function openBoard() {
  openPanel('board', 'THE ATELIER / FROM POSSIBILITY TO PRACTICE', 'Make something of it.', `
    <p class="panel-intro">Small steps have a way of becoming something.</p>
    <form id="task-form" class="task-form"><label class="sr-only" for="task-input">New task</label><input id="task-input" maxlength="280" placeholder="What’s one thing you’d like to do?" required><button class="button primary" type="submit">Add task <span>＋</span></button></form>
    <div class="workflow-board">${columns.map(c => `<section class="board-column" aria-label="${c.name}"><div class="column-heading"><span class="column-dot dot-${c.id}"></span><h3>${c.name}</h3><span class="column-count" id="count-${c.id}">0</span></div><div class="task-list" id="tasks-${c.id}"></div><p class="column-caption">${c.caption}</p></section>`).join('')}</div>
    <section class="idea-inbox"><div class="inbox-heading"><div>${icons.book}<h3>Idea Inbox <span id="idea-count">0</span></h3></div><span>FROM THE OBSERVATORY</span></div><div id="idea-list"></div></section>
    <div class="panel-footer"><span>SAVED ON THIS BROWSER. ONE STEP AT A TIME.</span><button class="text-button" id="visit-observatory">Back to a thought →</button></div>
  `);
  renderBoard();
  $('#task-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $<HTMLInputElement>('#task-input'); const text = input.value.trim();
    if (!text) { input.setCustomValidity('Write a small next step first.'); input.reportValidity(); return; }
    if (state.tasks.length >= 100) { toast('Your board has 100 tasks. Remove a task before adding another.'); return; }
    state.tasks.push({ id: newId(), text, column: 'todo' }); saveState(); input.value = ''; renderBoard(); input.focus();
  });
  $('#task-input').addEventListener('input', e => (e.target as HTMLInputElement).setCustomValidity(''));
  $('#visit-observatory').addEventListener('click', () => void travel('observatory'));
}

function renderBoard() {
  for (const column of columns) {
    const list = $(`#tasks-${column.id}`); list.replaceChildren();
    const tasks = state.tasks.filter(t => t.column === column.id);
    $(`#count-${column.id}`).textContent = String(tasks.length);
    if (!tasks.length) { const empty = document.createElement('p'); empty.className = 'empty-column'; empty.textContent = column.id === 'done' ? 'Good things take a little doing.' : column.id === 'progress' ? 'Give something your attention.' : 'Make room for a first step.'; list.append(empty); }
    for (const task of tasks) {
      const card = document.createElement('article'); card.className = 'task-card'; card.dataset.taskId = task.id;
      const p = document.createElement('p'); p.textContent = task.text;
      const actions = document.createElement('div'); actions.className = 'task-actions';
      const label = document.createElement('label'); label.textContent = 'Move to'; label.className = 'sr-only'; label.htmlFor = `move-${task.id}`;
      const select = document.createElement('select'); select.id = `move-${task.id}`; select.setAttribute('aria-label', `Move task: ${task.text.slice(0, 40)}`);
      for (const c of columns) { const option = document.createElement('option'); option.value = c.id; option.textContent = c.name; option.selected = c.id === task.column; select.append(option); }
      select.addEventListener('change', () => { task.column = select.value as Column; saveState(); renderBoard(); document.getElementById(`move-${task.id}`)?.focus(); toast(`Moved to ${columns.find(c => c.id === task.column)!.name}.`); });
      const remove = document.createElement('button'); remove.className = 'delete-button'; remove.setAttribute('aria-label', `Delete task: ${task.text.slice(0, 40)}`); remove.innerHTML = icons.close;
      remove.addEventListener('click', () => { state.tasks = state.tasks.filter(t => t.id !== task.id); saveState(); renderBoard(); });
      actions.append(label, select, remove); card.append(p, actions); list.append(card);
    }
  }
  $('#idea-count').textContent = String(state.ideas.length);
  const inbox = $('#idea-list'); inbox.replaceChildren();
  if (!state.ideas.length) { const empty = document.createElement('p'); empty.className = 'inbox-empty'; empty.textContent = 'A thought can become a next step. Send a note here from the Observatory.'; inbox.append(empty); }
  for (const idea of state.ideas) {
    const row = document.createElement('div'); row.className = 'idea-row';
    const p = document.createElement('p'); p.textContent = idea.text;
    const convert = document.createElement('button'); convert.className = 'button outlined'; convert.textContent = 'Make it a task →';
    convert.addEventListener('click', () => {
      if (state.tasks.length >= 100) { toast('Your board is full. Remove a task first.'); return; }
      state.tasks.push({ id: newId(), text: idea.text, column: 'todo' }); state.ideas = state.ideas.filter(i => i.id !== idea.id); saveState(); renderBoard(); toast('From a thought to a first step. Added to To do.');
    });
    const discard = document.createElement('button'); discard.className = 'delete-button'; discard.innerHTML = icons.close; discard.setAttribute('aria-label', `Discard idea: ${idea.text.slice(0, 40)}`);
    discard.addEventListener('click', () => { state.ideas = state.ideas.filter(i => i.id !== idea.id); saveState(); renderBoard(); });
    row.append(p, convert, discard); inbox.append(row);
  }
}

function openHelp() {
  openPanel('help', 'A SMALL FIELD GUIDE', 'Make yourself at home.', `
    <p class="panel-intro">There’s no right way to explore. Here are a few starting points.</p>
    <div class="help-grid"><div><span class="help-symbol">W A S D</span><h3>Find your own pace</h3><p>Move with WASD or arrow keys. On touch screens, use the four direction buttons at the bottom left. The camera follows you.</p></div>
    <div><span class="help-symbol">E / TAP</span><h3>A little closer</h3><p>Walk near a portal or desk and press E, or tap the interaction button. Floating labels and the Atlas also offer direct access.</p></div>
    <div>${icons.book}<h3>Curiosity → creation</h3><p>Write in the Observatory. Send a note to the Idea Inbox. Make it a task in the Atelier. Nothing leaves your browser.</p></div>
    <div>${icons.shirt}<h3>Come as you are</h3><p>Find the Wardrobe Atelier in the Hub. Preview a look, then apply it. Notes, tasks, timer, and outfit stay on this browser.</p></div></div>
    <div class="privacy-note"><strong>A private little prototype.</strong><p>No login, cloud sync, analytics, or external services. Local storage belongs to this browser and site address; clearing browser data removes it. Aether and the world names are working titles.</p></div>
    <button class="text-button danger" id="open-reset">Reset local demo data…</button>
  `);
  $('#open-reset').addEventListener('click', openReset);
}
function openReset() {
  openPanel('reset', 'A FRESH START', 'Begin again?', `<p class="panel-intro">This removes your notes, tasks, Idea Inbox, focus timer, and outfit choice from this browser. This cannot be undone.</p><div class="reset-actions"><button class="button outlined" id="cancel-reset">Keep my universe</button><button class="button primary danger-solid" id="confirm-reset">Reset demo data</button></div>`);
  $('#cancel-reset').addEventListener('click', openHelp);
  $('#confirm-reset').addEventListener('click', () => { resetData(); universe.changeOutfit(state.outfit); closePanel(); toast('A fresh page. Your local demo data has been reset.'); });
}
$$('.help-button, .control-hint').forEach(el => el.addEventListener('click', openHelp));

// Pointer capture supports held and simultaneous directions without sticky movement.
const heldDirections = new Map<number, string>();
function updateTouch() {
  const held = new Set(heldDirections.values());
  universe.touch.set(Number(held.has('right')) - Number(held.has('left')), Number(held.has('down')) - Number(held.has('up')));
}
$$<HTMLButtonElement>('[data-move]').forEach(button => {
  button.addEventListener('pointerdown', e => {
    if (!entered || activePanel) return;
    e.preventDefault(); button.setPointerCapture(e.pointerId); heldDirections.set(e.pointerId, button.dataset.move!); button.classList.add('pressed'); updateTouch();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => {
    heldDirections.delete((e as PointerEvent).pointerId); button.classList.remove('pressed'); updateTouch();
  });
});
window.addEventListener('blur', () => { heldDirections.clear(); $$('[data-move]').forEach(el => el.classList.remove('pressed')); });
document.addEventListener('aether:storage', (e: Event) => {
  if (!(e as CustomEvent).detail && !storageWarningShown) { storageWarningShown = true; toast('Browser storage is unavailable. Your changes are only kept for this visit.'); }
});
