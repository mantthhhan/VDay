// Get girl's name from URL parameter or use default
function getGirlName() {
  const params = new URLSearchParams(window.location.search);
  return params.get('m') || 'Sweetie';
}

// Update headline with dynamic name
function setHeadline() {
  const girlName = getGirlName();
  const headline = document.querySelector('.headline');
  if (headline) {
    headline.textContent = `Hey ${girlName}, will you be my Valentine?`;
  }
}

// Valentine page interactions
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const result = document.getElementById('result');
const confettiRoot = document.getElementById('confetti');
const bgMusic = document.getElementById('bgMusic');

if (!yesBtn || !noBtn) {
  console.warn('Buttons not found in DOM');
}

// Set the dynamic headline when page loads
document.addEventListener('DOMContentLoaded', setHeadline);

// Ensure the No button stays hard to click by moving it to a random visible position
function moveNoButton(playful = true){
  if (result && !result.hidden) return; // don't tease after acceptance
  const pad = 12; // padding inside the card
  const card = document.querySelector('.card');
  if(!card || !noBtn) return;
  const cardRect = card.getBoundingClientRect();
  // if the button is still in the normal flow (relative), convert to absolute
  const currentRect = noBtn.getBoundingClientRect();
  let btnW = currentRect.width;
  let btnH = currentRect.height;
  if (getComputedStyle(noBtn).position !== 'absolute'){
    // compute its offset relative to the card and switch to absolute without visually jumping
    const offsetLeft = currentRect.left - cardRect.left;
    const offsetTop = currentRect.top - cardRect.top;
    noBtn.style.position = 'absolute';
    noBtn.style.left = Math.floor(offsetLeft) + 'px';
    noBtn.style.top = Math.floor(offsetTop) + 'px';
  }
  const rect = noBtn.getBoundingClientRect();
  btnW = rect.width;
  btnH = rect.height;

  // compute ranges relative to the card content box
  const minLeft = pad;
  const maxLeft = Math.max(pad, cardRect.width - btnW - pad);
  const minTop = pad + 48; // leave room for headline area
  const maxTop = Math.max(pad, cardRect.height - btnH - pad);

  // Try several times to find a position that doesn't overlap the Yes button
  let newLeft, newTop;
  const maxAttempts = 18;
  let attempt = 0;
  const minSeparation = Math.max(110, btnW * 0.9);
  const yesRect = yesBtn ? yesBtn.getBoundingClientRect() : null;
  const yesRel = yesRect ? {
    left: Math.max(0, Math.min(cardRect.width, yesRect.left - cardRect.left)),
    top: Math.max(0, Math.min(cardRect.height, yesRect.top - cardRect.top)),
    right: Math.max(0, Math.min(cardRect.width, yesRect.right - cardRect.left)),
    bottom: Math.max(0, Math.min(cardRect.height, yesRect.bottom - cardRect.top)),
    width: yesRect.width,
    height: yesRect.height
  } : null;

  function boxesOverlap(ax,ay,aw,ah, bx,by,bw,bh){
    return !(ax+aw < bx || bx+bw < ax || ay+ah < by || by+bh < ay);
  }

  while(attempt < maxAttempts){
    attempt++;
    newLeft = Math.floor(Math.random() * (maxLeft - minLeft + 1)) + minLeft;
    newTop = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

    if(!yesRel) break;

    // check bounding box overlap between candidate No rect and Yes rect
    const noBoxX = newLeft;
    const noBoxY = newTop;
    if(!boxesOverlap(noBoxX, noBoxY, btnW, btnH, yesRel.left, yesRel.top, yesRel.width, yesRel.height)){
      // also ensure minimum center distance
      const noCenterX = noBoxX + btnW/2;
      const noCenterY = noBoxY + btnH/2;
      const yesCenterX = yesRel.left + yesRel.width/2;
      const yesCenterY = yesRel.top + yesRel.height/2;
      const dist = Math.hypot(noCenterX-yesCenterX, noCenterY-yesCenterY);
      if(dist >= minSeparation) break;
    }
  }

  // If attempts exhausted and still overlapping, place below Yes predictably
  if(yesRel && attempt >= maxAttempts){
    newLeft = Math.min(maxLeft, Math.max(minLeft, yesRel.left));
    newTop = Math.min(maxTop, Math.max(minTop, yesRel.bottom + 18));
  }

  // Apply smooth animation via left/top inside card
  noBtn.style.transition = 'left 520ms cubic-bezier(.2,.9,.3,1), top 520ms cubic-bezier(.2,.9,.3,1)';
  noBtn.style.position = 'absolute';
  noBtn.style.left = newLeft + 'px';
  noBtn.style.top = newTop + 'px';

  if(playful){
    // tiny bounce to tease
    noBtn.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-8px)' },
      { transform: 'translateY(0)' }
    ], { duration: 420, easing: 'ease-out' });
  }
}

// Move when user tries to hover / approach
let lastMove = 0;
document.addEventListener('mousemove', (e)=>{
  if (!noBtn) return;
  const now = Date.now();
  if(now - lastMove < 160) return; // throttle
  const nbRect = noBtn.getBoundingClientRect();
  const dx = e.clientX - (nbRect.left + nbRect.width/2);
  const dy = e.clientY - (nbRect.top + nbRect.height/2);
  const dist = Math.hypot(dx,dy);
  const threshold = Math.max(90, Math.min(window.innerWidth/5, 200));
  if(dist < threshold){
    lastMove = now;
    moveNoButton(true);
  }
});

// Touch support and pointer events to make it hard to tap
if (noBtn) {
  noBtn.addEventListener('mouseenter', ()=> moveNoButton(true));
  noBtn.addEventListener('pointerenter', ()=> moveNoButton(true));
  noBtn.addEventListener('mousedown', (e)=>{ e.preventDefault(); moveNoButton(true); });
  noBtn.addEventListener('pointerdown', (e)=>{ e.preventDefault(); moveNoButton(true); });
  noBtn.addEventListener('click', (e)=>{ e.preventDefault(); moveNoButton(true); });
  noBtn.addEventListener('touchstart', (e)=>{ e.preventDefault(); moveNoButton(true); }, {passive:false});
}

// Yes button reveals the message and starts confetti
yesBtn.addEventListener('click', ()=>{
  const btnArea = document.getElementById('buttonArea');
  if (btnArea) btnArea.style.display = 'none';
  if (result) result.hidden = false;
  // gentle celebration
  launchHearts(36);
  // optional: give yes button a little pulse
  yesBtn.animate([{ transform: 'scale(1)' },{ transform: 'scale(1.06)' },{ transform: 'scale(1)' }], { duration: 520, easing: 'ease-out' });
});

// Confetti / hearts effect
function launchHearts(count=20){
  for(let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'heart';
    const size = Math.random()*22 + 10;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (50 + (Math.random()*60-30)) + '%';
    el.style.bottom = '-8%';
    el.style.position = 'fixed';
    el.style.zIndex = 8;
    el.style.pointerEvents = 'none';
    // slight color variation
    const r1 = Math.floor(240 + Math.random()*15);
    const r2 = Math.floor(80 + Math.random()*80);
    el.style.background = `linear-gradient(135deg, rgba(${r1},${r2},${r2+10},1), ${'#ff6b81'})`;
    el.style.transform = 'rotate(45deg)';
    confettiRoot.appendChild(el);

    const animDur = 2200 + Math.random()*1600;
    const xShift = (Math.random()*260 - 130);
    const rotate = (Math.random()*220 - 110);
    el.animate([
      { transform: `translate(0px,0px) rotate(45deg)`, opacity:1 },
      { transform: `translate(${xShift}px,-${260 + Math.random()*300}px) rotate(${rotate}deg)`, opacity:0 }
    ], { duration: animDur, easing: 'cubic-bezier(.2,.7,.4,1)' });

    // cleanup after animation
    setTimeout(()=>{ el.remove(); }, animDur + 120);
  }
}

// Music toggle: play/pause. User may add a file at assets/music.mp3 and uncomment source in HTML.
if (musicToggle && bgMusic){
  musicToggle.addEventListener('click', ()=>{
    if(bgMusic.paused){
      bgMusic.play().catch(()=>{});
      musicToggle.textContent = '🔊 On';
    } else {
      bgMusic.pause();
      musicToggle.textContent = '🔈 Mute';
    }
  });
}

// Keep the No button initially in a cute position centered-right
window.addEventListener('load', ()=>{
  if(!noBtn) return;
  // place using the shared moveNoButton logic once (non-playful)
  moveNoButton(false);
});
