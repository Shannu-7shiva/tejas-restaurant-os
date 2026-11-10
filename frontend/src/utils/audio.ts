/**
 * Synthesizes an elegant restaurant service bell chime using the browser's Web Audio API.
 * Guaranteed to work zero-dependency and offline.
 */
export const playKitchenChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Frequencies resembling high-grade brass service bell chime (E6 + G#6 harmonic)
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime);
    osc2.frequency.setValueAtTime(1661.22, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    osc1.stop(ctx.currentTime + 1.6);
    osc2.stop(ctx.currentTime + 1.6);
  } catch (err) {
    console.warn('Audio chime playback inhibited by browser policy:', err);
  }
};
