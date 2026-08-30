/* ============================================================
   Pony Games -- shared runtime
   Storage, chimes, speech, pony art, and the letter geometry
   both games draw from. Loaded before each game's own script.
   ============================================================ */
"use strict";

const PG = (() => {

/* ---------- content you'll actually want to edit ---------- */

// Her tricky nine. Add letters here and both games pick them up.
const POOL = ["b","d","p","q","g","j","i","y","w"];

// Letter names, spelled as real words so no voice has to improvise.
const NAMES = {b:"bee", d:"dee", p:"pea", q:"cue", g:"gee",
               j:"jay", i:"eye", y:"why", w:"double you"};

// Sounds are spoken as keywords, never as bare sounds. Speech
// engines spell out tokens they don't recognize ("guh" -> "G-U-H"),
// and real words are the only reliable way around it. Each word
// must START with the letter's sound -- swap freely, keep the rule.
const KEYWORD = {b:"ball", d:"dog", p:"pig", q:"queen", g:"goat",
                 j:"jam", i:"igloo", y:"yarn", w:"web"};

// Who each letter gets mixed up with, per case.
const CONFUSE_LOWER = {
  b:["d","p","q"], d:["b","q","p"], p:["q","b","d"], q:["p","d","b"],
  g:["j","q","y"], j:["g","i","y"], i:["j","y","l"],
  y:["w","j","i"], w:["y","i","j"]
};
const CONFUSE_UPPER = {
  b:["d","p","g"], d:["b","p","q"], p:["b","d","q"], q:["g","d","p"],
  g:["q","j","d"], j:["i","g","y"], i:["j","y","w"],
  y:["w","j","i"], w:["y","i","j"]
};

const COATS = [
  ["#F7C6D9","#8E4C77","#E8A8C2"], ["#C9A7E8","#5E4A8E","#B18FD6"],
  ["#A8DCD1","#2F7F6E","#8FCBBE"], ["#FFD9A0","#B9782E","#F0C287"],
  ["#B9C7F0","#4A5C9E","#9EAEE0"], ["#F4A9C0","#A83C68","#E28FA9"],
  ["#AEDCF0","#2D6E8E","#94C8E0"], ["#E8C4A0","#9A6738","#D4AC86"],
  ["#E0BBE4","#7A3F8E","#CCA2D2"], ["#FFC1CC","#B04A62","#F0A7B5"],
  ["#CDE8A8","#5B8E2F","#B5D68E"], ["#FFE0B5","#C08A3A","#F2CB99"]
];

/* ============================================================
   LETTER GEOMETRY
   Every letter lives in a 100x100 box on the same ruling:
     ascender top 26 | x-height top 46 | BASELINE 72 | descender 88
     capital top 30
   Bowls are r=13 centered at y=59, so they fill the x-height.

   STROKES lists each letter as an ordered set of pen strokes, in
   the order a child is taught to form it. The tracing game plays
   them in sequence; the direction each path runs is the direction
   she has to move her finger, so the start point matters as much
   as the shape.
   ============================================================ */

const STROKES = {
  // ---- lowercase: the reversal set ----
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
  W: ["M32 30 L41 72 L50 42 L59 72 L68 30"]
};

// Both games draw from the same strokes, so a letter looks
// identical whether she's reading it or writing it. System fonts
// can't be trusted here -- they give a double-story g, a
// two-story a, and letterforms that vary by device. Any letter
// missing from STROKES falls back to the font, so adding one to
// POOL still works, it just won't be traceable until you give it
// strokes.
const DRAWN = STROKES;

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
const named  = g => (isBig(g) ? "big " : "little ") + NAMES[base(g)];
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

function fillMeadow(el, total, earned){
  el.innerHTML = Array.from({length:total},(_,i)=>ponySVG(i, i < earned ? "here" : "")).join("");
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

return { POOL, NAMES, KEYWORD, CONFUSE_LOWER, CONFUSE_UPPER, COATS, STROKES, DRAWN,
         base, isBig, cased, shuffle, store,
         tone, ding, blip, buzz, cheer, unlockAudio,
         loadVoices, wireVoicePicker, setTalkIndicator, speak, named, starts,
         ruling, tileSVG, ponySVG, fillMeadow, noDoubleTapZoom, showScreen };
})();
