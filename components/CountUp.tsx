"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function CountUp({ value, formatter }: { value: number; formatter: (n: number) => string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);

  return <>{formatter(display)}</>;
}
