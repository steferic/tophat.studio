export function playIceSlideSound() {
  const ctx = new AudioContext();
  const duration = 0.4;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(2400, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
  gain2.gain.setValueAtTime(0.08, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start();
  osc2.stop(ctx.currentTime + 0.3);
}

export function playGlacierCrushSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noise.buffer = buffer;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 2;
  noiseGain.gain.setValueAtTime(0.2, ctx.currentTime + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(ctx.currentTime + 0.05);
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(60, ctx.currentTime + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.6);
  gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.1);
  osc2.stop(ctx.currentTime + 0.6);
}

/** Bloom attack: warm shimmer with rising harmonic chime */
export function playBloomSound() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  // Warm pad swell
  const pad = ctx.createOscillator();
  const padGain = ctx.createGain();
  const padFilter = ctx.createBiquadFilter();
  pad.type = 'sine';
  pad.frequency.setValueAtTime(440, now);
  pad.frequency.linearRampToValueAtTime(660, now + 1.5);
  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(600, now);
  padFilter.frequency.linearRampToValueAtTime(2000, now + 1.2);
  padGain.gain.setValueAtTime(0.001, now);
  padGain.gain.linearRampToValueAtTime(0.15, now + 0.4);
  padGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
  padGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  pad.connect(padFilter).connect(padGain).connect(ctx.destination);
  pad.start(now);
  pad.stop(now + 2.5);
  // Chime harmonics — staggered bell tones
  const chimeFreqs = [880, 1320, 1760];
  chimeFreqs.forEach((freq, i) => {
    const delay = 0.15 + i * 0.25;
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(freq, now + delay);
    chimeGain.gain.setValueAtTime(0.08, now + delay);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
    chime.connect(chimeGain).connect(ctx.destination);
    chime.start(now + delay);
    chime.stop(now + delay + 0.6);
  });
  // Soft whoosh
  const bufSize = ctx.sampleRate * 0.8;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    const env = t < 0.2 ? t / 0.2 : Math.pow(1 - (t - 0.2) / 0.6, 2);
    d[i] = (Math.random() * 2 - 1) * env * 0.3;
  }
  const whoosh = ctx.createBufferSource();
  const whooshGain = ctx.createGain();
  const whooshFilter = ctx.createBiquadFilter();
  whoosh.buffer = buf;
  whooshFilter.type = 'bandpass';
  whooshFilter.frequency.setValueAtTime(2000, now);
  whooshFilter.frequency.exponentialRampToValueAtTime(500, now + 0.8);
  whooshFilter.Q.value = 0.8;
  whooshGain.gain.setValueAtTime(0.12, now);
  whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  whoosh.connect(whooshFilter).connect(whooshGain).connect(ctx.destination);
  whoosh.start(now);
}

/** Thorn Storm attack: aggressive slicing wind with sharp impacts */
export function playThornStormSound() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  // Whipping wind noise
  const bufSize = ctx.sampleRate * 1.8;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    const env = t < 0.1 ? t / 0.1 : Math.pow(1 - (t - 0.1) / 1.7, 1.2);
    d[i] = (Math.random() * 2 - 1) * env;
  }
  const wind = ctx.createBufferSource();
  const windGain = ctx.createGain();
  const windFilter = ctx.createBiquadFilter();
  wind.buffer = buf;
  windFilter.type = 'bandpass';
  windFilter.frequency.setValueAtTime(1200, now);
  windFilter.frequency.exponentialRampToValueAtTime(400, now + 1.8);
  windFilter.Q.value = 1.5;
  windGain.gain.setValueAtTime(0.25, now);
  windGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
  wind.connect(windFilter).connect(windGain).connect(ctx.destination);
  wind.start(now);
  // Sharp thorn slices — rapid high-freq bursts
  for (let s = 0; s < 6; s++) {
    const delay = 0.05 + s * 0.18;
    const slice = ctx.createOscillator();
    const sliceGain = ctx.createGain();
    slice.type = 'sawtooth';
    slice.frequency.setValueAtTime(1800 + ((s * 4327) % 800), now + delay);
    slice.frequency.exponentialRampToValueAtTime(400, now + delay + 0.08);
    sliceGain.gain.setValueAtTime(0.1, now + delay);
    sliceGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
    slice.connect(sliceGain).connect(ctx.destination);
    slice.start(now + delay);
    slice.stop(now + delay + 0.08);
  }
  // Low menacing rumble
  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = 'sine';
  rumble.frequency.setValueAtTime(80, now);
  rumble.frequency.exponentialRampToValueAtTime(35, now + 1.5);
  rumbleGain.gain.setValueAtTime(0.2, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
  rumble.connect(rumbleGain).connect(ctx.destination);
  rumble.start(now);
  rumble.stop(now + 1.5);
}

/** Light hit: quick thud + short rattle */
export function playHitLightSound() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  // Thud
  const thud = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(200, now);
  thud.frequency.exponentialRampToValueAtTime(60, now + 0.15);
  thudGain.gain.setValueAtTime(0.3, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  thud.connect(thudGain).connect(ctx.destination);
  thud.start(now);
  thud.stop(now + 0.15);
  // Short noise crack
  const bufSize = ctx.sampleRate * 0.1;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 4);
  }
  const crack = ctx.createBufferSource();
  const crackGain = ctx.createGain();
  crack.buffer = buf;
  crackGain.gain.setValueAtTime(0.2, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  crack.connect(crackGain).connect(ctx.destination);
  crack.start(now);
}

/** Heavy hit: deep boom + noise burst + rattling debris */
export function playHitHeavySound() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  // Deep boom
  const boom = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(120, now);
  boom.frequency.exponentialRampToValueAtTime(25, now + 0.4);
  boomGain.gain.setValueAtTime(0.4, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  boom.connect(boomGain).connect(ctx.destination);
  boom.start(now);
  boom.stop(now + 0.4);
  // Noise burst
  const bufSize = ctx.sampleRate * 0.5;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    const env = t < 0.03 ? t / 0.03 : Math.pow(1 - (t - 0.03) / 0.47, 2);
    d[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noise.buffer = buf;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 600;
  noiseFilter.Q.value = 1;
  noiseGain.gain.setValueAtTime(0.25, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  // Debris rattle — staggered pops
  for (let p = 0; p < 5; p++) {
    const delay = 0.08 + p * 0.06;
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = 'square';
    pop.frequency.setValueAtTime(800 + ((p * 3571) % 600), now + delay);
    pop.frequency.exponentialRampToValueAtTime(200, now + delay + 0.05);
    popGain.gain.setValueAtTime(0.06, now + delay);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);
    pop.connect(popGain).connect(ctx.destination);
    pop.start(now + delay);
    pop.stop(now + delay + 0.05);
  }
  // Sub bass aftershock
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(40, now + 0.1);
  sub.frequency.exponentialRampToValueAtTime(18, now + 0.6);
  subGain.gain.setValueAtTime(0.2, now + 0.1);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  sub.connect(subGain).connect(ctx.destination);
  sub.start(now + 0.1);
  sub.stop(now + 0.6);
}

export function playInfernoSound() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const boom = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(200, now);
  boom.frequency.exponentialRampToValueAtTime(30, now + 0.4);
  boomGain.gain.setValueAtTime(0.4, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  boom.connect(boomGain).connect(ctx.destination);
  boom.start(now);
  boom.stop(now + 0.4);
  const bufferSize = ctx.sampleRate * 1.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    const env = t < 0.15 ? t / 0.15 : Math.pow(1 - (t - 0.15) / 1.25, 1.5);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noise.buffer = buffer;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(800, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 1.4);
  noiseFilter.Q.value = 1;
  noiseGain.gain.setValueAtTime(0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  const scream = ctx.createOscillator();
  const screamGain = ctx.createGain();
  scream.type = 'sawtooth';
  scream.frequency.setValueAtTime(60, now);
  scream.frequency.exponentialRampToValueAtTime(600, now + 0.5);
  scream.frequency.exponentialRampToValueAtTime(80, now + 1.2);
  screamGain.gain.setValueAtTime(0.12, now);
  screamGain.gain.setValueAtTime(0.2, now + 0.3);
  screamGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  scream.connect(screamGain).connect(ctx.destination);
  scream.start(now);
  scream.stop(now + 1.2);
  for (let d = 0; d < 4; d++) {
    const delay = 0.1 + d * 0.2;
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = 'square';
    pop.frequency.setValueAtTime(1500 + ((d * 7919) % 1000), now + delay);
    pop.frequency.exponentialRampToValueAtTime(300, now + delay + 0.15);
    popGain.gain.setValueAtTime(0.05, now + delay);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
    pop.connect(popGain).connect(ctx.destination);
    pop.start(now + delay);
    pop.stop(now + delay + 0.15);
  }
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(45, now + 0.2);
  sub.frequency.exponentialRampToValueAtTime(20, now + 1.4);
  subGain.gain.setValueAtTime(0.25, now + 0.2);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
  sub.connect(subGain).connect(ctx.destination);
  sub.start(now + 0.2);
  sub.stop(now + 1.4);
}

/** Cube attack: metallic locking snap + crystalline shimmer + deep void resonance */
export function playCubeSound() {
  const audio = new Audio('audio/sfx/annihilation.mp3');
  audio.volume = 0.85;
  audio.play().catch(() => {});
}

/** Cube break: glass shatter noise burst + bright release chime */
export function playCubeBreakSound() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  // Glass shatter noise burst
  const bufSize = ctx.sampleRate * 0.4;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    const env = t < 0.02 ? t / 0.02 : Math.pow(1 - (t - 0.02) / 0.38, 2.5);
    d[i] = (Math.random() * 2 - 1) * env;
  }
  const shatter = ctx.createBufferSource();
  const shatterGain = ctx.createGain();
  const shatterFilter = ctx.createBiquadFilter();
  shatter.buffer = buf;
  shatterFilter.type = 'highpass';
  shatterFilter.frequency.value = 2000;
  shatterFilter.Q.value = 0.5;
  shatterGain.gain.setValueAtTime(0.3, now);
  shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  shatter.connect(shatterFilter).connect(shatterGain).connect(ctx.destination);
  shatter.start(now);
  // Bright release chime
  const chimeFreqs = [1200, 1800, 2700];
  chimeFreqs.forEach((freq, i) => {
    const delay = 0.03 + i * 0.06;
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(freq, now + delay);
    chimeGain.gain.setValueAtTime(0.1, now + delay);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
    chime.connect(chimeGain).connect(ctx.destination);
    chime.start(now + delay);
    chime.stop(now + delay + 0.4);
  });
  // Pop of release
  const pop = ctx.createOscillator();
  const popGain = ctx.createGain();
  pop.type = 'sine';
  pop.frequency.setValueAtTime(300, now);
  pop.frequency.exponentialRampToValueAtTime(80, now + 0.15);
  popGain.gain.setValueAtTime(0.25, now);
  popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  pop.connect(popGain).connect(ctx.destination);
  pop.start(now);
  pop.stop(now + 0.15);
}
