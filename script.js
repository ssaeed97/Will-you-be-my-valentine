const qs = (selector) => document.querySelector(selector);
const question = qs(".question");
const gif = qs(".gif");
const [yesBtn, noBtn] = [".yes-btn", ".no-btn"].map(qs);
const celebrateAudio = qs("#celebrate-audio");

// =============================
// FX: Confetti + Fireworks (Canvas)
// =============================
const fxCanvas = document.getElementById("fx");
const fxCtx = fxCanvas.getContext("2d");

function resizeFX() {
  const dpr = window.devicePixelRatio || 1;
  fxCanvas.width = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
  fxCanvas.style.width = window.innerWidth + "px";
  fxCanvas.style.height = window.innerHeight + "px";
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}
window.addEventListener("resize", resizeFX);
resizeFX();

let fxRunning = false;
let confetti = [];
let sparks = [];
let lastT = 0;
let stopAt = 0;

const COLORS = ["#e94d58", "#ff7aa2", "#ffd1dc", "#ffffff", "#ff4da6", "#ffcc66"];

function rand(min, max) { return Math.random() * (max - min) + min; }

function startFX(durationMs = 6000) {
  confetti = [];
  sparks = [];
  stopAt = performance.now() + durationMs;
  if (!fxRunning) {
    fxRunning = true;
    lastT = performance.now();
    requestAnimationFrame(tickFX);
  }

  // Seed confetti
  for (let i = 0; i < 160; i++) spawnConfetti();

  // Firework bursts periodically
  scheduleFireworks(durationMs);
}

function spawnConfetti() {
  const w = window.innerWidth;
  confetti.push({
    x: rand(0, w),
    y: rand(-120, -10),
    vx: rand(-2.5, 2.5),
    vy: rand(2.5, 6.5),
    size: rand(4, 9),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.18, 0.18),
    color: COLORS[(Math.random() * COLORS.length) | 0],
    life: rand(240, 420),
  });
}

function spawnFireworkBurst(cx, cy) {
  const count = 70 + ((Math.random() * 50) | 0);
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(2.2, 7.5);
    sparks.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: rand(1.5, 3.0),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: rand(40, 80),
    });
  }
}

function scheduleFireworks(durationMs) {
  const end = performance.now() + durationMs;
  const loop = () => {
    const now = performance.now();
    if (now > end) return;

    // random burst location
    const x = rand(80, window.innerWidth - 80);
    const y = rand(80, window.innerHeight * 0.55); // keep fireworks mostly top-ish
    spawnFireworkBurst(x, y);

    // schedule next burst
    const nextIn = rand(420, 900);
    setTimeout(loop, nextIn);
  };
  // start quickly
  setTimeout(loop, 120);
}

function tickFX(t) {
  const dt = Math.min(34, t - lastT); // cap dt
  lastT = t;

  fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // Confetti update/render
  for (const p of confetti) {
    p.x += p.vx * (dt / 16.67);
    p.y += p.vy * (dt / 16.67);
    p.rot += p.vr * (dt / 16.67);
    p.vy += 0.03 * (dt / 16.67); // gravity
    p.life -= 1;

    fxCtx.save();
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);
    fxCtx.fillStyle = p.color;
    fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    fxCtx.restore();
  }

  // Remove dead confetti + respawn while time remains
  confetti = confetti.filter(p => p.life > 0 && p.y < window.innerHeight + 40);
  if (t < stopAt && confetti.length < 180) {
    for (let i = 0; i < 6; i++) spawnConfetti();
  }

  // Sparks update/render
  for (const s of sparks) {
    s.x += s.vx * (dt / 16.67);
    s.y += s.vy * (dt / 16.67);
    s.vy += 0.10 * (dt / 16.67); // gravity
    s.vx *= 0.985;               // air drag
    s.vy *= 0.985;
    s.life -= 1;

    // glow-ish look
    fxCtx.globalAlpha = Math.max(0, Math.min(1, s.life / 80));
    fxCtx.beginPath();
    fxCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    fxCtx.fillStyle = s.color;
    fxCtx.fill();
  }
  fxCtx.globalAlpha = 1;
  sparks = sparks.filter(s => s.life > 0);

  // stop when done + no particles left
  if (t > stopAt && confetti.length === 0 && sparks.length === 0) {
    fxRunning = false;
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    return;
  }

  requestAnimationFrame(tickFX);
}


const handleYesClick = () => {
  // Play claps/cheers (user gesture = allowed)
  if (celebrateAudio) {
    celebrateAudio.currentTime = 0;
    celebrateAudio.volume = 0.9;
    celebrateAudio.play().catch(() => {
      // Autoplay policies shouldn't block because this is a click,
      // but catch prevents console noise if something fails.
    });
  }

  question.innerHTML = "Yeahhhhhhhhhhh! See you then!!";
  gif.src = "https://media.giphy.com/media/UMon0fuimoAN9ueUNP/giphy.gif";
  startFX(6500); // 6.5 seconds of confetti + fireworks


  // Remove the 'mouseover' event listener from noBtn
  noBtn.removeEventListener("mouseover", handleNoMouseOver);

  // Remove the noBtn from the DOM
  noBtn.remove();

  yesBtn.remove();

  // Define predefined romantic date ideas
  const dateIdeas = [
    "Cook a romantic dinner together",
    "Go for a moonlit walk on the beach",
    "Have a picnic in the park",
    "Take a dance class together",
    "Stargaze in the backyard",
    "Take a hot air balloon ride",
    "Explore a botanical garden",
    "Attend a live outdoor concert",
    "Visit an art gallery",
    "Go on a weekend getaway to a cozy cabin",
    "Attend a cooking class together",
    "Plan a movie marathon night at home",
    "Take a scenic train ride",
    "Go horseback riding",
    "Visit a local winery for a wine tasting",
    "Go kayaking or canoeing",
    "Attend a comedy show",
    "Take a scenic hike and have a picnic",
    "Go on a sunrise or sunset photo shoot",
    "Attend a local farmers' market",
    "Explore a historic neighborhood",
    "Take a dance lesson together",
    "Have a DIY spa night at home",
    "Go on a bike ride together",
    "Plan a themed dinner night at home",
    "Attend a live theater performance",
    "Go on a scenic drive",
    "Visit a local chocolate or dessert shop",
    "Take a pottery or ceramics class",
    "Attend a local sports game",
    "Plan a day trip to a nearby city",
    "Have a karaoke night at home or at a local venue",
    "Attend a local festival or fair",
    "Go on a scenic boat tour",
    "Visit a local bookstore and pick out books for each other",
    "Have a picnic in a local park",
    "Take a photography workshop together",
    "Explore a new hiking trail",
    "Attend a wine and paint night",
    "Visit a nearby beach or lake",
    "Plan a game night with board games or card games",
    "Take a pottery or ceramics class",
    "Attend a trivia night at a local bar",
    "Go on a hot air balloon ride",
    "Take a scenic train ride",
    "Plan a movie night with your favorite films",
    "Go on a helicopter tour",
    "Attend a live outdoor concert",
    "Visit a local art gallery",
    "Go on a brewery tour",
    "Take a scenic drive through the countryside",
    "Attend a live comedy show",
    "Visit a local botanical garden",
    "Have a picnic in a vineyard",
    "Take a cooking class together",
    "Go on a river cruise",
    "Plan a weekend getaway to a cozy cabin",
    "Attend a dance class together",
    "Take a day trip to a nearby national park",
    "Go on a bike ride along a scenic trail",
    "Visit a local museum",
    "Have a DIY spa day at home",
    "Attend a live theater performance",
    "Go on a scenic hike and have a picnic",
    "Take a painting class together",
    "Attend a local farmers' market",
    "Explore a historic neighborhood",
    "Go horseback riding",
    "Have a themed dinner night at home",
    "Attend a local sports game",
    "Plan a day trip to a nearby city",
    "Have a karaoke night at home or at a local venue",
    "Attend a wine and cheese tasting",
    "Visit a local chocolate or dessert shop",
    "Take a pottery or ceramics class",
    "Attend a live music performance",
    "Go on a boat tour",
    "Visit a local bookstore and pick out books for each other",
    "Take a photography workshop together",
    "Explore a new hiking trail",
    "Attend a wine and paint night",
    "Visit a nearby beach or lake",
    "Plan a game night with board games or card games",
    "Take a pottery or ceramics class",
    "Attend a trivia night at a local bar",
    "Go on a hot air balloon ride",
    "Take a scenic train ride",
    "Plan a movie night with your favorite films",
    "Go on a helicopter tour",
    "Attend a live outdoor concert",
    "Visit a local art gallery",
    "Go on a brewery tour",
    "Take a scenic drive through the countryside",
    "Attend a live comedy show",
    "Visit a local botanical garden",
    "Have a picnic in a vineyard",
    "Take a cooking class together",
    "Go on a river cruise",
    "Plan a weekend getaway to a cozy cabin",
    "Attend a dance class together",

    // Add more date ideas as needed
  ];

  // Create and style a new button for Let's Go!
  // const letsGoBtn = document.createElement("button");
  // letsGoBtn.textContent = "Let's Go!";
  // letsGoBtn.classList.add("letsgo-btn"); // You can add a class for styling if needed
  // letsGoBtn.style.position = "absolute";

  // Adjust the left position based on screen width
  if (window.innerWidth <= 800) {
    letsGoBtn.style.left = "95%";
  } else {
    letsGoBtn.style.left = "63%";
  }

  // letsGoBtn.style.transform = "translate(-50%, -50%)";
  // letsGoBtn.style.width = "200px"; // Adjust the width as needed

  // // Add a click event listener to prompt the user with random romantic date ideas
  // letsGoBtn.addEventListener("click", () => {
  //   const randomIndex = Math.floor(Math.random() * dateIdeas.length);
  //   const selectedDateIdea = dateIdeas[randomIndex];

  //   alert(`How about this romantic date idea: ${selectedDateIdea}`);
  // });

  // Replace yesBtn with the new letsGoBtn
  // yesBtn.replaceWith(letsGoBtn);
};

const handleNoMouseOver = () => {
  const { width, height } = noBtn.getBoundingClientRect();
  const maxX = window.innerWidth - width;
  const maxY = window.innerHeight - height;

  noBtn.style.left = `${Math.floor(Math.random() * maxX)}px`;
  noBtn.style.top = `${Math.floor(Math.random() * maxY)}px`;
};

yesBtn.addEventListener("click", handleYesClick);
noBtn.addEventListener("mouseover", handleNoMouseOver);
