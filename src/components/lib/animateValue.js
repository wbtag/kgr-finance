'use client'
import { useState, useEffect } from "react";

export default function animateValue(target, duration = 250) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const start = value;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(start + diff * progress);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target]);

  return value;
}