import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useSpring } from "motion/react";
import { formatRM } from "../domain";

export function AnimatedCurrency({ valueSen }: { valueSen: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 28, mass: 0.8 });
  const [displaySen, setDisplaySen] = useState(0);
  useMotionValueEvent(spring, "change", (latest) => setDisplaySen(Math.round(latest)));
  useEffect(() => spring.set(valueSen), [spring, valueSen]);
  return <motion.span aria-label={formatRM(valueSen)}>{formatRM(displaySen)}</motion.span>;
}
