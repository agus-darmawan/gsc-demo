let context: AudioContext | null = null;

/** Short two-tone alert for critical events (no audio assets needed). */
export function playAlertTone(): void {
  if (typeof window === "undefined") return;
  try {
    context ??= new AudioContext();
    const ctx = context;
    const start = ctx.currentTime;
    [880, 660].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.08, start + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + i * 0.18);
      osc.stop(start + i * 0.18 + 0.17);
    });
  } catch {
    /* audio not available */
  }
}
