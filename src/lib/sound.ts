// Web Audio API synthesized alert sound so no external sound files are needed
export function playChimeSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Play a friendly 3-beep chime indicating rest is over
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(587.33, 0, 0.2); // D5
    playTone(739.99, 0.18, 0.2); // F#5
    playTone(880.0, 0.36, 0.45); // A5

    if (navigator?.vibrate) {
      navigator.vibrate([150, 80, 200]);
    }
  } catch (e) {
    console.warn("Audio notification not supported or allowed yet:", e);
  }
}
