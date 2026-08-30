/* ============================================================
   Pony Games -- shared runtime
   Storage, chimes, speech, pony art, and the letter geometry
   both games draw from. Loaded before each game's own script.
   ============================================================ */
"use strict";

const PG = (() => {

/* ---------- content you'll actually want to edit ---------- */

const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const DIGITS      = "0123456789".split("");
const ALL_GLYPHS  = ALL_LETTERS.concat(DIGITS);

// Her tricky nine. This is only the DEFAULT focus set -- what a
// fresh device starts on. The live set is whatever she's chosen in
// the picker; read it with focus(), never from here.
const DEFAULT_FOCUS = ["b","d","p","q","g","j","i","y","w"];

// Glyph names, spelled as real words so no voice has to improvise.
const NAMES = {
  a:"ay",   b:"bee",  c:"see",  d:"dee",  e:"ee",   f:"eff",
  g:"gee",  h:"aitch",i:"eye",  j:"jay",  k:"kay",  l:"ell",
  m:"em",   n:"en",   o:"oh",   p:"pea",  q:"cue",  r:"ar",
  s:"ess",  t:"tee",  u:"you",  v:"vee",  w:"double you",
  x:"ex",   y:"why",  z:"zee",
  "0":"zero","1":"one","2":"two","3":"three","4":"four",
  "5":"five","6":"six","7":"seven","8":"eight","9":"nine"
};

// Sounds are spoken as keywords, never as bare sounds. Speech
// engines spell out tokens they don't recognize ("guh" -> "G-U-H"),
// and real words are the only reliable way around it. Each word
// must START with the letter's sound -- swap freely, keep the rule.
// x is the one letter English gives no word for; "x-ray" is the
// classroom convention and is what she'll meet at school.
// Digits deliberately have no entry: a numeral has a name but no
// initial sound, so sounds mode skips them. Ask with hasSound().
const KEYWORD = {
  a:"apple", b:"ball",  c:"cat",      d:"dog",   e:"egg",   f:"fish",
  g:"goat",  h:"hat",   i:"igloo",    j:"jam",   k:"kite",  l:"leaf",
  m:"moon",  n:"nest",  o:"octopus",  p:"pig",   q:"queen", r:"rain",
  s:"sun",   t:"tree",  u:"umbrella", v:"van",   w:"web",
  x:"x-ray", y:"yarn",  z:"zebra"
};

// Who each glyph gets mixed up with, per case. Values are always
// lowercase; the game applies whichever case it needs. Digits are
// shared by both tables since a numeral has no case -- and 6/9 is
// their b/d, which is the whole reason they earn a place here.
const CONFUSE_DIGITS = {
  "0":["8","6","9"], "1":["7","4","9"], "2":["5","7","3"],
  "3":["8","5","2"], "4":["9","7","1"], "5":["6","3","2"],
  "6":["9","0","5"], "7":["1","4","2"], "8":["3","0","6"],
  "9":["6","0","4"]
};

const CONFUSE_LOWER = Object.assign({
  a:["o","c","d"], b:["d","p","q"], c:["e","o","a"], d:["b","q","p"],
  e:["c","a","o"], f:["t","l","j"], g:["j","q","y"], h:["n","b","k"],
  i:["j","l","y"], j:["g","i","y"], k:["h","x","y"], l:["i","t","j"],
  m:["n","w","h"], n:["m","h","r"], o:["c","e","a"], p:["q","b","d"],
  q:["p","d","b"], r:["n","v","i"], s:["z","c","e"], t:["f","l","i"],
  u:["v","n","w"], v:["w","u","y"], w:["v","m","u"], x:["k","y","v"],
  y:["v","w","j"], z:["s","n","x"]
}, CONFUSE_DIGITS);

const CONFUSE_UPPER = Object.assign({
  a:["v","r","h"], b:["d","p","r"], c:["g","o","q"], d:["o","b","p"],
  e:["f","b","l"], f:["e","p","t"], g:["c","o","q"], h:["n","m","a"],
  i:["l","t","j"], j:["i","l","u"], k:["x","r","y"], l:["i","j","t"],
  m:["n","w","h"], n:["m","h","z"], o:["q","c","d"], p:["r","b","f"],
  q:["o","g","c"], r:["p","b","k"], s:["z","c","g"], t:["i","l","f"],
  u:["v","j","o"], v:["w","u","y"], w:["v","m","u"], x:["k","y","v"],
  y:["v","x","t"], z:["s","n","x"]
}, CONFUSE_DIGITS);

// Coats for the pony skin, scales for the dino skin. Same shape of
// data -- [body, mane/crest, shade] -- so the art code is identical
// either way and only the palette changes.
const COATS = [
  ["#F7C6D9","#8E4C77","#E8A8C2"], ["#C9A7E8","#5E4A8E","#B18FD6"],
  ["#A8DCD1","#2F7F6E","#8FCBBE"], ["#FFD9A0","#B9782E","#F0C287"],
  ["#B9C7F0","#4A5C9E","#9EAEE0"], ["#F4A9C0","#A83C68","#E28FA9"],
  ["#AEDCF0","#2D6E8E","#94C8E0"], ["#E8C4A0","#9A6738","#D4AC86"],
  ["#E0BBE4","#7A3F8E","#CCA2D2"], ["#FFC1CC","#B04A62","#F0A7B5"],
  ["#CDE8A8","#5B8E2F","#B5D68E"], ["#FFE0B5","#C08A3A","#F2CB99"]
];

const SCALES = [
  ["#8FD1A6","#2E7A4F","#74BC8C"], ["#F0C36B","#A9762A","#DFAE52"],
  ["#7FC4D8","#2C6F86","#66AEC4"], ["#E39B72","#9C4E28","#D0855C"],
  ["#A8C97F","#5B8034","#8FB566"], ["#D9A0C8","#8A4278","#C588B4"],
  ["#88BFE0","#35678F","#6EA8CD"], ["#EFB08A","#A85F32","#DC9770"],
  ["#9CD2B8","#3C8464","#82BC9F"], ["#E8CE7C","#9E7A20","#D6B95F"],
  ["#BFD98A","#6E8F34","#A6C46F"], ["#7EC9BC","#2B7A6C","#65B0A3"]
];

/* ============================================================
   GLYPH GEOMETRY
   Every glyph lives in a 100x100 box on the same ruling:
     ascender top 26 | x-height top 46 | BASELINE 72 | descender 88
     capital top 30  | digits sit cap height, 30 to 72
   Bowls are r=13 centered at y=59, so they fill the x-height.

   STROKES lists each glyph as an ordered set of pen strokes, in
   the order a child is taught to form it. The tracing game plays
   them in sequence; the direction each path runs is the direction
   she has to move her finger, so the start point matters as much
   as the shape.

   Arc direction matters here and is easy to get backwards. SVG's
   y axis points down, so on a circle centred (cx,cy) the point at
   angle t is (cx + r*cos t, cy + r*sin t), which puts t=90 at the
   BOTTOM. sweep=1 increases t. Reading b and d side by side is the
   quickest way to re-derive it: same circle, opposite sweep.
   ============================================================ */

const STROKES = {
  // ---- lowercase ----
  // The reversal set first, since it is the reason this game exists.
  // b: stem down first, then the bowl swings right. d does the
  // opposite -- bowl first, swinging left. Different motor plans
  // are what stop them collapsing into the same shape.
  // The bowl is a full circle tangent to the stem, drawn from the
  // stem outward: b sweeps right (clockwise), d sweeps left. Same
  // circle, opposite direction -- which is exactly the distinction
  // her hand needs to learn.
  b: ["M37 26 V72", "M37 59 A13 13 0 0 1 63 59 A13 13 0 0 1 37 59"],
  d: ["M63 59 A13 13 0 0 0 37 59 A13 13 0 0 0 63 59", "M63 26 V72"],
  p: ["M37 46 V88", "M37 59 A13 13 0 0 1 63 59 A13 13 0 0 1 37 59"],
  q: ["M63 59 A13 13 0 0 0 37 59 A13 13 0 0 0 63 59", "M63 46 V88"],

  // g: closed circle, then a straight stem hooking left below the
  // baseline. Single-story -- the form she is taught to read.
  g: ["M50 46 A13 13 0 1 0 50 72 A13 13 0 1 0 50 46",
      "M63 46 V79 C63 85 57 88 50 85.5"],

  i: ["M50 46 V72",                          "M50 33 L50 35"],
  j: ["M56 46 V79 C56 85 50 88 43 85.5",     "M56 33 L56 35"],
  y: ["M37 46 L52 68",                       "M63 46 L42 88"],
  w: ["M34 46 L42 72 L50 50 L58 72 L66 46"],

  // a is d with a short stem: same bowl, same sweep, stem stopped
  // at the baseline. Teaching them as one motor plan is deliberate.
  a: ["M63 59 A13 13 0 0 0 37 59 A13 13 0 0 0 63 59", "M63 46 V72"],
  c: ["M58.4 49 A13 13 0 1 0 58.4 69"],
  e: ["M37 59 H63", "M63 59 A13 13 0 1 0 58.4 69"],
  f: ["M60 31 C60 25 47 24 47 33 V72", "M38 46 H58"],
  h: ["M38 26 V72", "M38 59 A11 11 0 0 1 60 59 V72"],
  k: ["M38 26 V72", "M58 46 L40 62", "M46 56 L60 72"],
  l: ["M50 26 V72"],
  m: ["M34 46 V72", "M34 56 A8 8 0 0 1 50 56 V72", "M50 56 A8 8 0 0 1 66 56 V72"],
  n: ["M38 46 V72", "M38 57 A11 11 0 0 1 60 57 V72"],
  o: ["M50 46 A13 13 0 1 0 50 72 A13 13 0 1 0 50 46"],
  r: ["M38 46 V72", "M38 56 C39 49 47 45 57 47"],
  s: ["M60 51 C58 45 42 44 41 51 C40 57 60 60 59 66 C58 73 43 72 40 66"],
  t: ["M48 34 V66 C48 71 54 73 59 70", "M38 46 H60"],
  u: ["M38 46 V61 A11 11 0 0 0 60 61", "M60 46 V72"],
  v: ["M36 46 L50 72 L64 46"],
  x: ["M38 46 L62 72", "M62 46 L38 72"],
  z: ["M38 46 H62 L38 72 H62"],

  // ---- uppercase ----
  B: ["M38 30 V72", "M38 30 H55 A11 11 0 1 1 55 51 H38",
                    "M38 51 H57 A10.5 10.5 0 1 1 57 72 H38"],
  D: ["M38 30 V72", "M38 30 H49 A21 21 0 1 1 49 72 H38"],
  P: ["M38 30 V72", "M38 30 H55 A11 11 0 1 1 55 52 H38"],
  Q: ["M50 30 A16 21 0 1 0 50 72 A16 21 0 1 0 50 30", "M57 60 L68 77"],
  G: ["M69 39 A21 21 0 1 0 69 63", "M69 63 V52 H58"],
  J: ["M58 30 V61 C58 69 50 74 42 70"],
  I: ["M38 30 H62", "M50 30 V72", "M38 72 H62"],
  Y: ["M36 30 L50 52", "M64 30 L50 52", "M50 52 V72"],
  W: ["M32 30 L41 72 L50 42 L59 72 L68 30"],

  A: ["M36 72 L50 30", "M50 30 L64 72", "M41 59 H59"],
  C: ["M63.5 34.9 A21 21 0 1 0 63.5 67.1"],
  E: ["M38 30 V72", "M38 30 H62", "M38 51 H58", "M38 72 H62"],
  F: ["M38 30 V72", "M38 30 H62", "M38 51 H58"],
  H: ["M38 30 V72", "M62 30 V72", "M38 51 H62"],
  K: ["M38 30 V72", "M62 30 L40 53", "M47 46 L63 72"],
  L: ["M38 30 V72", "M38 72 H62"],
  M: ["M34 72 V30 L50 58 L66 30 V72"],
  N: ["M38 72 V30 L62 72 V30"],
  O: ["M50 30 A16 21 0 1 0 50 72 A16 21 0 1 0 50 30"],
  R: ["M38 30 V72", "M38 30 H55 A11 11 0 1 1 55 52 H38", "M50 52 L64 72"],
  S: ["M64 40 C62 32 42 30 40 39 C38 48 64 51 63 60 C62 70 42 71 37 63"],
  T: ["M36 30 H64", "M50 30 V72"],
  U: ["M38 30 V60 A12 12 0 0 0 62 60 V30"],
  V: ["M36 30 L50 72 L64 30"],
  X: ["M36 30 L64 72", "M64 30 L36 72"],
  Z: ["M37 30 H63 L37 72 H63"],

  // ---- digits ----
  // 6 and 9 are the pair that matters, and they are built as
  // opposites on purpose, the same way b and d are: 9 is a closed
  // bowl up top with a straight stem down the right, 6 is a curved
  // approach falling into a bowl down low. Different motor plans
  // again, for the same reason.
  "0": ["M50 30 A15 21 0 1 0 50 72 A15 21 0 1 0 50 30"],
  "1": ["M42 38 L52 30 V72"],
  "2": ["M38 38 C40 30 54 28 60 35 C65 42 55 51 38 72 H63"],
  "3": ["M38 36 C42 29 58 29 60 38 C61 45 52 50 46 50 C54 50 63 54 62 62 C61 71 43 74 38 66"],
  "4": ["M57 30 L36 58 H64", "M57 30 V72"],
  "5": ["M42 30 V48 C51 43 63 47 63 58 C63 69 48 74 39 67", "M42 30 H61"],
  "6": ["M60 34 C48 28 37 40 37 59 A13 13 0 0 0 63 59 A13 13 0 0 0 37 59"],
  "7": ["M38 30 H63 L45 72"],
  "8": ["M50 30 C42 30 38 35 38 40 C38 50 62 54 62 62 C62 68 57 72 50 72 C43 72 38 68 38 62 C38 54 62 50 62 40 C62 35 58 30 50 30"],
  "9": ["M63 43 A13 13 0 0 0 37 43 A13 13 0 0 0 63 43", "M63 43 V72"]
};

// Both games draw from the same strokes, so a glyph looks
// identical whether she's reading it or writing it. System fonts
// can't be trusted here -- they give a double-story g, a
// two-story a, and letterforms that vary by device.
const DRAWN = STROKES;

// The tracing game is only safe on glyphs that have strokes. One
// without them used to slip through as an instant win: the empty
// path measures zero length, which trips the short-stroke shortcut
// meant for the dots on i and j. Ask before offering a glyph.
const traceable = g => Array.isArray(STROKES[g]) && STROKES[g].length > 0;

// A numeral has a name but no initial sound, so sounds mode has
// nothing to ask for. Everything with a keyword can be sounded out.
const isDigit  = g => g >= "0" && g <= "9";
const hasSound = g => !!KEYWORD[g.toLowerCase()];

/* ---------- helpers ---------- */
const base  = g => g.toLowerCase();
const isBig = g => g !== g.toLowerCase();
const cased = (letter, big) => big ? letter.toUpperCase() : letter;
const shuffle = a => {
  for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; }
  return a;
};

/* ---------- storage (falls back to memory if blocked) ---------- */
const mem = {};
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return mem[k] ?? null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ mem[k]=v; } }
};

/* ---------- focus set ---------- */
// What she is actually practising: shared by both games, remembered
// per device, and the single source both the hub picker and the
// in-game picker write to. A device that has never been set falls
// back to the tricky nine rather than to the whole alphabet, since
// thirty-six glyphs at once is nobody's idea of practice.
function focus(){
  const raw = store.get("focus");
  if(raw === null || raw === undefined) return DEFAULT_FOCUS.slice();
  const picked = raw.split(",").filter(g => ALL_GLYPHS.includes(g));
  return picked.length ? picked : DEFAULT_FOCUS.slice();
}
// An empty set is refused rather than saved. There is no sensible
// game to build from no glyphs, and silently falling back to the
// default would look like the picker had ignored her.
function setFocus(list){
  const clean = list.filter(g => ALL_GLYPHS.includes(g));
  if(!clean.length) return false;
  store.set("focus", clean.join(","));
  return true;
}

/* ---------- chimes ---------- */
let ac = null;
function tone(freq,start,dur,type,vol){
  if(!ac) return;
  const o=ac.createOscillator(), g=ac.createGain();
  o.type=type; o.frequency.setValueAtTime(freq,ac.currentTime+start);
  g.gain.setValueAtTime(0.0001,ac.currentTime+start);
  g.gain.exponentialRampToValueAtTime(vol,ac.currentTime+start+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+start+dur);
  o.connect(g); g.connect(ac.destination);
  o.start(ac.currentTime+start); o.stop(ac.currentTime+start+dur+0.03);
}
const ding  = () => { tone(1046,0,.16,"sine",.28); tone(1568,.09,.32,"sine",.24); };
const blip  = () => { tone(880,0,.1,"sine",.2); };
const buzz  = () => { tone(240,0,.18,"triangle",.16); tone(196,.09,.2,"triangle",.13); };
const cheer = () => { [784,988,1175,1568].forEach((f,i)=>tone(f,i*.11,.3,"sine",.22)); };

// iOS will not make a sound until a real tap has happened, so
// every game calls this from its Play button.
function unlockAudio(){
  if(!ac){ try{ ac = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
  if(ac && ac.state === "suspended") ac.resume();
  loadVoices();
}

/* ---------- speech ---------- */
// Web Speech borrows the iPad's own system voices. For a big jump
// in clarity, download an Enhanced or Premium voice under
// Settings > Accessibility > Spoken Content > Voices.
const FEMALE_FIRST = ["Samantha","Ava","Allison","Susan","Zoe","Nicky",
                      "Karen","Moira","Tessa","Fiona","Serena","Kate",
                      "Google US English","Microsoft Aria","Microsoft Zira"];
let voice = null, voiceList = [], talkEl = null;

function loadVoices(){
  if(!window.speechSynthesis) return;
  const all = speechSynthesis.getVoices();
  if(!all.length) return;
  voiceList = all.filter(v => !v.lang || v.lang.toLowerCase().startsWith("en"));
  if(!voiceList.length) voiceList = all;
  voiceList.sort((a,b) => {
    const ra = FEMALE_FIRST.findIndex(n => a.name.startsWith(n));
    const rb = FEMALE_FIRST.findIndex(n => b.name.startsWith(n));
    return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb);
  });
  const sel = document.querySelector("select.voices");
  if(sel){
    sel.innerHTML = voiceList.map((v,i)=>`<option value="${i}">${v.name}</option>`).join("");
    const saved = voiceList.findIndex(v => v.name === store.get("voice"));
    const idx = saved >= 0 ? saved : 0;
    sel.value = String(idx);
    voice = voiceList[idx];
  } else if(!voice){
    voice = voiceList[0];
  }
}
function wireVoicePicker(onChange){
  const sel = document.querySelector("select.voices");
  if(!sel) return;
  sel.addEventListener("change", e => {
    voice = voiceList[+e.target.value];
    if(voice) store.set("voice", voice.name);
    if(onChange) onChange();
  });
}
function setTalkIndicator(el){ talkEl = el; }

function speak(text, then){
  if(!window.speechSynthesis){ if(then) then(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if(voice) u.voice = voice;
  u.rate = 0.9; u.pitch = 1.1; u.volume = 1;
  u.lang = (voice && voice.lang) || "en-US";
  if(talkEl) talkEl.classList.add("talking");
  u.onend = u.onerror = () => {
    if(talkEl) talkEl.classList.remove("talking");
    if(then) then();
  };
  speechSynthesis.speak(u);
}

if(window.speechSynthesis){
  loadVoices();
  speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

/* ---------- phrasing ---------- */
// A numeral has no case, so "little seven" would be wrong as well
// as confusing. Digits are just said by name.
const named  = g => isDigit(g) ? NAMES[g]
                              : (isBig(g) ? "big " : "little ") + NAMES[base(g)];
const starts = g => "the one that starts " + KEYWORD[base(g)];

/* ---------- art ---------- */
function ruling(){
  return `<line class="midline"  x1="10" y1="46" x2="90" y2="46"/>
          <line class="baseline" x1="10" y1="72" x2="90" y2="72"/>`;
}

function tileSVG(glyph, cardClass){
  const drawn = DRAWN[glyph];
  const body = drawn
    ? drawn.map(d => `<path class="drawn" d="${d}"/>`).join("")
    : `<text class="glyph" x="50" y="72" text-anchor="middle" font-size="54">${glyph}</text>`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
    <rect class="card ${cardClass||""}" x="1.5" y="1.5" width="97" height="97" rx="13"/>
    ${ruling()}
    ${body}
  </svg>`;
}

function ponySVG(i, cls){
  const [coat, mane, shade] = COATS[i % COATS.length];
  return `<svg class="${cls||""}" viewBox="0 0 116 96" preserveAspectRatio="xMidYMax meet">
    <path d="M20 46 C3 42 2 72 12 90 C17 74 20 62 31 59 Z" fill="${mane}"/>
    <rect x="32" y="60" width="12" height="31" rx="6" fill="${shade}"/>
    <rect x="70" y="60" width="12" height="31" rx="6" fill="${shade}"/>
    <rect x="46" y="62" width="12" height="29" rx="6" fill="${coat}"/>
    <rect x="84" y="62" width="12" height="29" rx="6" fill="${coat}"/>
    <ellipse cx="58" cy="50" rx="34" ry="21" fill="${coat}"/>
    <path d="M78 40 C79 27 85 17 94 14 L105 27 C96 32 89 42 87 52 Z" fill="${coat}"/>
    <ellipse cx="97" cy="26" rx="16" ry="12.5" fill="${coat}"/>
    <ellipse cx="108" cy="32" rx="7.5" ry="6" fill="${shade}"/>
    <path d="M86 15 L88 3 L96 12 Z" fill="${coat}"/>
    <path d="M76 34 C71 19 79 6 93 2 C86 11 85 23 89 32 Z" fill="${mane}"/>
    <circle cx="100" cy="24" r="2.6" fill="#3B2A44"/>
    <path d="M52 40 l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="${mane}" opacity=".5"/>
  </svg>`;
}

// Same silhouette as the pony on purpose: body, four legs, tail
// left, head upper right. At meadow size these are 26px tall, and
// keeping the layout identical is what lets either one read as an
// animal at that size. The back plates are drawn before the body so
// their bases tuck underneath and only the spikes show.
function dinoSVG(i, cls){
  const [body, crest, shade] = SCALES[i % SCALES.length];
  return `<svg class="${cls||""}" viewBox="0 0 116 96" preserveAspectRatio="xMidYMax meet">
    <path d="M26 52 C9 54 1 72 5 90 C16 77 20 65 33 60 Z" fill="${body}"/>
    <path d="M34 37 L41 19 L49 32 Z" fill="${crest}"/>
    <path d="M50 32 L58 15 L67 31 Z" fill="${crest}"/>
    <path d="M68 34 L76 20 L83 41 Z" fill="${crest}"/>
    <rect x="32" y="60" width="13" height="31" rx="5" fill="${shade}"/>
    <rect x="70" y="60" width="13" height="31" rx="5" fill="${shade}"/>
    <rect x="46" y="62" width="13" height="29" rx="5" fill="${body}"/>
    <rect x="84" y="62" width="12" height="29" rx="5" fill="${body}"/>
    <ellipse cx="58" cy="50" rx="34" ry="21" fill="${body}"/>
    <path d="M80 42 C82 28 88 18 96 15 L106 27 C97 33 90 42 88 52 Z" fill="${body}"/>
    <ellipse cx="98" cy="25" rx="17" ry="12" fill="${body}"/>
    <ellipse cx="110" cy="30" rx="7" ry="5.5" fill="${shade}"/>
    <circle cx="102" cy="22" r="2.6" fill="#2E3B2A"/>
    <ellipse cx="52" cy="58" rx="9" ry="6" fill="${shade}" opacity=".55"/>
  </svg>`;
}

/* ---------- skins ---------- */
// Two skins, same games. Everything that differs between them lives
// here: the art, the palette (applied by shared.css off data-theme),
// and every word a child sees or hears. Nothing else in the codebase
// should ever say "pony" or "meadow" in a string.
const SKINS = {
  pony: {
    key:"pony", label:"Ponies", name:"Pony", games:"Pony Games",
    letters:"Pony Letters", trace:"Pony Trace",
    one:"pony", many:"ponies", place:"meadow",
    themeColor:"#F7D5E4", art: ponySVG
  },
  dino: {
    key:"dino", label:"Dinos", name:"Dino", games:"Dino Games",
    letters:"Dino Letters", trace:"Dino Trace",
    one:"dino", many:"dinos", place:"jungle",
    themeColor:"#D9E8B8", art: dinoSVG
  }
};

function skin(){ return SKINS[store.get("skin")] || SKINS.pony; }
function setSkin(k){ if(SKINS[k]){ store.set("skin", k); applySkin(); } }

// Paints the whole page for the current skin: the palette swap is a
// single attribute on <html> that shared.css keys off, the words are
// filled from any element carrying data-word, and the iOS status bar
// tint is kept in step so a home-screen app doesn't show the other
// skin's colour behind the notch.
function applySkin(){
  const s = skin();
  document.documentElement.setAttribute("data-theme", s.key);
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute("content", s.themeColor);
  document.querySelectorAll("[data-word]").forEach(el => {
    const w = s[el.dataset.word];
    if(w !== undefined) el.textContent = w;
  });
  document.querySelectorAll("[data-critter]").forEach(el => {
    el.innerHTML = s.art(+el.dataset.critter || 0);
  });
}

const critterSVG = (i, cls) => skin().art(i, cls);

// The strip of creatures that fills as she gets them right. Named
// for the pony skin it started as; it draws whichever skin is on.
function fillMeadow(el, total, earned){
  el.innerHTML = Array.from({length:total},(_,i)=>critterSVG(i, i < earned ? "here" : "")).join("");
}

/* ---------- glyph picker ---------- */
// The one control for what she is practising. Mounted twice -- open
// on the hub, collapsed on each game's title screen -- but both
// instances read and write the same stored set, so they cannot drift
// apart. onChange fires only on a real change, and only after the
// new set is saved.
const PRESETS = {
  tricky:  () => DEFAULT_FOCUS.slice(),
  letters: () => ALL_LETTERS.slice(),
  digits:  () => DIGITS.slice(),
  all:     () => ALL_GLYPHS.slice()
};

// Twelve is about as many as fit on a phone before the summary
// wraps into the Play button. Past that, say how many are hiding.
function focusSummary(list){
  return list.length <= 12
    ? list.join(" ")
    : list.slice(0,10).join(" ") + " +" + (list.length - 10);
}

function mountPicker(el, opts){
  opts = opts || {};
  const collapsible = !!opts.collapsible;

  el.classList.add("picker");
  if(collapsible) el.classList.add("collapsible");
  el.innerHTML =
    `<button class="picksum" type="button" aria-expanded="${collapsible ? "false" : "true"}">
       <span class="list"></span>${collapsible ? '<span class="chev"></span>' : ""}
     </button>
     <div class="pickbody">
       ${[ALL_LETTERS, DIGITS].map(list => `<div class="glyphgrid">${
         list.map(g => `<button type="button" data-g="${g}" aria-pressed="false">${g}</button>`).join("")
       }</div>`).join("")}
       <div class="presets">
         <button type="button" data-preset="tricky">Tricky nine</button>
         <button type="button" data-preset="letters">a-z</button>
         <button type="button" data-preset="digits">0-9</button>
         <button type="button" data-preset="all">Everything</button>
       </div>
     </div>`;

  const sum  = el.querySelector(".picksum");
  const list = el.querySelector(".picksum .list");

  function paint(){
    const on = focus();
    list.textContent = focusSummary(on);
    el.querySelectorAll("[data-g]").forEach(b =>
      b.setAttribute("aria-pressed", String(on.includes(b.dataset.g))));
  }

  // Saving is refused when it would empty the set, so the last
  // selected glyph simply won't turn off. Silently reverting to a
  // default here would read as the picker ignoring her.
  function commit(next){
    if(!setFocus(next)) return;
    paint();
    if(opts.onChange) opts.onChange(focus());
  }

  el.addEventListener("click", e => {
    const g = e.target.closest("[data-g]");
    if(g){
      const on = focus();
      commit(on.includes(g.dataset.g) ? on.filter(x => x !== g.dataset.g)
                                      : ALL_GLYPHS.filter(x => on.includes(x) || x === g.dataset.g));
      return;
    }
    const p = e.target.closest("[data-preset]");
    if(p){ commit(PRESETS[p.dataset.preset]()); return; }
    if(collapsible && e.target.closest(".picksum"))
      sum.setAttribute("aria-expanded", sum.getAttribute("aria-expanded") === "true" ? "false" : "true");
  });

  paint();
  return {refresh: paint};
}

/* ---------- skin switch ---------- */
function mountSkinSwitch(el, onChange){
  el.classList.add("skinset");
  el.innerHTML = Object.keys(SKINS).map(k =>
    `<button type="button" data-skin="${k}" aria-pressed="false">${SKINS[k].art(0)}<span>${SKINS[k].label}</span></button>`
  ).join("");

  function paint(){
    const cur = skin().key;
    el.querySelectorAll("[data-skin]").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.skin === cur)));
  }
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-skin]");
    if(!b || b.dataset.skin === skin().key) return;
    setSkin(b.dataset.skin);
    paint();
    if(onChange) onChange(skin());
  });
  paint();
  return {refresh: paint};
}

/* ---------- misc ---------- */
function noDoubleTapZoom(){
  let last = 0;
  document.addEventListener("touchend", e => {
    const now = Date.now();
    if(now - last < 320) e.preventDefault();
    last = now;
  }, {passive:false});
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("on", s.id === id));
}

return { DEFAULT_FOCUS, ALL_LETTERS, DIGITS, ALL_GLYPHS,
         NAMES, KEYWORD, CONFUSE_LOWER, CONFUSE_UPPER, COATS, SCALES, STROKES, DRAWN,
         traceable, isDigit, hasSound, focus, setFocus,
         base, isBig, cased, shuffle, store,
         tone, ding, blip, buzz, cheer, unlockAudio,
         loadVoices, wireVoicePicker, setTalkIndicator, speak, named, starts,
         ruling, tileSVG, ponySVG, dinoSVG, critterSVG, fillMeadow,
         SKINS, skin, setSkin, applySkin, mountPicker, mountSkinSwitch, focusSummary,
         noDoubleTapZoom, showScreen };
})();

// Every page is loaded with shared.js at the end of <body>, so the
// document exists by now and the skin can be painted before the
// game's own script draws anything.
PG.applySkin();
