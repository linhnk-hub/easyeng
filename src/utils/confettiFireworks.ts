import confetti from 'canvas-confetti';

/**
 * Fires a grand fireworks spectacle with multi-angle cannon bursts
 * when a player achieves maximum score / 3 stars.
 */
export function fireGrandFireworks() {
  // Center instant burst
  confetti({
    particleCount: 100,
    spread: 90,
    origin: { y: 0.6 },
    zIndex: 9999
  });

  const duration = 2.2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 45 * (timeLeft / duration);

    // Left cannon
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() * 0.4 + 0.3 },
      colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#facc15']
    });

    // Right cannon
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() * 0.4 + 0.3 },
      colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#facc15']
    });
  }, 220);
}
