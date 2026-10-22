"use client";

import { type MouseEvent, useEffect, useReducer, useState } from "react";
import { LandingLogic } from "./landing-logic";
import { LandingView } from "./landing-view";
import "./landing.css";

type Tip = { text: string; x: number; y: number };

export function Landing() {
  const [page] = useState(() => new LandingLogic({}));
  const [, render] = useReducer((n: number) => n + 1, 0);
  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    page.listener = render;
    page.componentDidMount();
    return () => {
      page.listener = null;
      page.componentWillUnmount();
    };
  }, [page]);
  // Fixed to the viewport (the document panels scroll and clip), so it follows its key on any scroll.
  const [key, setKey] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!key) return setTip(null);
    const place = () => {
      if (!key.isConnected) return setKey(null);
      const r = key.getBoundingClientRect();
      const x = Math.max(16, Math.min(r.left, window.innerWidth - 246));
      setTip({ text: key.dataset.tip ?? "", x, y: r.top - 7 });
    };
    place();
    window.addEventListener("scroll", place, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", place, { capture: true });
  }, [key]);

  // Delegated: a key keeps its tip in `data-tip`.
  const onOver = (event: MouseEvent) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-tip]");
    if (el?.dataset.tip) setKey(el);
  };
  const onOut = (event: MouseEvent) => {
    const from = (event.target as HTMLElement).closest("[data-tip]");
    const to = (event.relatedTarget as HTMLElement | null)?.closest("[data-tip]");
    if (from && from !== to) setKey(null);
  };

  return (
    <div className="uc-landing" onMouseOver={onOver} onMouseOut={onOut}>
      <LandingView v={page.renderVals()} />
      {tip && (
        <span className="ltip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
          {tip.text}
        </span>
      )}
    </div>
  );
}
