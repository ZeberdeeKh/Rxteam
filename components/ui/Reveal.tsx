"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Поява блоку при прокручуванні вниз (scroll-reveal, у дусі ab3): елемент стартує
// прозорим/зміщеним і випливає, коли потрапляє у в'юпорт. Спрацьовує один раз.
// Реалізація стилів — клас .rx-reveal / .is-visible у globals.css.
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number; // мс, для каскадної затримки
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rx-reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
