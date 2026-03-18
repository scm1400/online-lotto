import { useCallback, useRef } from 'react';

export function useSound(_src?: string) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      const now = ctx.currentTime;

      // Paper stick sound: short noise burst + low thud
      // 1. Noise burst (paper sliding)
      const noiseLen = 0.08;
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 3000;
      noiseFilter.Q.value = 0.5;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + noiseLen);

      noiseSource.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
      noiseSource.start(now);

      // 2. Thud (impact)
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(150, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.3, now + 0.05);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(thudGain).connect(ctx.destination);
      osc.start(now + 0.05);
      osc.stop(now + 0.2);
    } catch {
      // Audio not supported — silent fallback
    }
  }, []);

  return { play };
}
