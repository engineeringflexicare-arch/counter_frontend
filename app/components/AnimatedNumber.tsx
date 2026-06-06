import { useEffect, useState } from "react";

export default function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}
