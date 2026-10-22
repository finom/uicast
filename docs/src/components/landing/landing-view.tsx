"use client";

// Generated once from the approved Design canvas (~/Work/random/uicast-landing) and maintained here since.
import { Fragment } from "react";
import { PromptMarkdown } from "./prompt-markdown";
import { css, type V } from "./css";

export function LandingView({ v }: { v: V }) {
  return (
    <div
      style={css(
        "background: var(--l-bg); color: var(--l-ink); font-family: var(--font-sans); font-size: 17px; line-height: 1.6; min-width: 0; overflow-x: hidden",
      )}
    >
      {" "}
      <div
        style={css(
          "padding-left: max(24px, env(safe-area-inset-left, 0px)); padding-right: max(24px, env(safe-area-inset-right, 0px)); border-bottom: 1px solid var(--l-line)",
        )}
      >
        <nav
          aria-label="Main"
          style={css(
            "max-width: 1392px; min-height: 64px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px",
          )}
        >
          <a href="/" style={css("display: flex; align-items: center; gap: 10px; text-decoration: none")}>
            <picture style={css("display: flex")}>
              <source media="(prefers-color-scheme: dark)" srcSet="/logo-text-dark.svg" />
              <img src="/logo-text.svg" alt="uicast" width={110} height={26} />
            </picture>
            <span
              style={css(
                "font-family: var(--font-mono); font-size: 11px; line-height: 1.6; letter-spacing: 0.08em; text-transform: uppercase; color: var(--l-accent-text); background: var(--l-tint); border-radius: 999px; padding: 2px 9px",
              )}
            >
              beta
            </span>
          </a>
          <div style={css("display: flex; align-items: center; gap: 22px; font-size: 15px")}>
            <a
              className="navanchor"
              href="#product"
              style={css("color: var(--l-text); text-decoration: none; padding-block: 10px")}
            >
              For product teams
            </a>
            <a
              className="navanchor"
              href="#developers"
              style={css("color: var(--l-text); text-decoration: none; padding-block: 10px")}
            >
              For developers
            </a>
            <a href="/about" style={css("color: var(--l-text); text-decoration: none; padding-block: 10px")}>
              Docs
            </a>
            <a
              className="navgithub"
              href="https://github.com/finom/uicast"
              style={css("display: flex; color: var(--l-ink); padding-block: 10px")}
            >
              <svg width="24" height="24" viewBox="3 3 18 18" fill="currentColor" role="img">
                <title>GitHub</title>
                <path d="M12 3C7.0275 3 3 7.12937 3 12.2276C3 16.3109 5.57625 19.7597 9.15374 20.9824C9.60374 21.0631 9.77249 20.7863 9.77249 20.5441C9.77249 20.3249 9.76125 19.5982 9.76125 18.8254C7.5 19.2522 6.915 18.2602 6.735 17.7412C6.63375 17.4759 6.19499 16.6569 5.8125 16.4378C5.4975 16.2647 5.0475 15.838 5.80124 15.8264C6.51 15.8149 7.01625 16.4954 7.18499 16.7723C7.99499 18.1679 9.28875 17.7758 9.80625 17.5335C9.885 16.9337 10.1212 16.53 10.38 16.2993C8.3775 16.0687 6.285 15.2728 6.285 11.7432C6.285 10.7397 6.63375 9.9092 7.20749 9.26326C7.1175 9.03257 6.8025 8.08674 7.2975 6.81794C7.2975 6.81794 8.05125 6.57571 9.77249 7.76377C10.4925 7.55615 11.2575 7.45234 12.0225 7.45234C12.7875 7.45234 13.5525 7.55615 14.2725 7.76377C15.9937 6.56418 16.7475 6.81794 16.7475 6.81794C17.2424 8.08674 16.9275 9.03257 16.8375 9.26326C17.4113 9.9092 17.76 10.7281 17.76 11.7432C17.76 15.2843 15.6563 16.0687 13.6537 16.2993C13.98 16.5877 14.2613 17.1414 14.2613 18.0065C14.2613 19.2407 14.25 20.2326 14.25 20.5441C14.25 20.7863 14.4188 21.0746 14.8688 20.9824C16.6554 20.364 18.2079 19.1866 19.3078 17.6162C20.4077 16.0457 20.9995 14.1611 21 12.2276C21 7.12937 16.9725 3 12 3Z" />
              </svg>
            </a>
            <a
              href="https://warehouse.uicast.dev"
              className="navdemo"
              style={css(
                "flex-shrink: 0; background: var(--l-ink); color: var(--l-bg); text-decoration: none; border-radius: 999px; padding: 10px 18px; font-weight: 600; line-height: 1.25",
              )}
            >
              Live demo
            </a>
          </div>
        </nav>
      </div>{" "}
      <div
        style={css(
          "padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px))",
        )}
      >
        <section
          style={css(
            "position: relative; max-width: 1240px; margin: 0 auto; padding-block: 64px 40px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 22px",
          )}
        >
          <div
            className="sticker"
            aria-hidden="true"
            style={css(
              "--r: -7deg; left: 0; top: 70px; background: var(--l-card); border-radius: 18px; padding: 14px 16px; box-shadow: 0 0 0 1px var(--l-ring), 0 14px 34px var(--l-shadow); text-align: left; width: 190px",
            )}
          >
            <p style={css("margin: 0; font-size: 12px; color: var(--l-muted2)")}>Your share</p>
            <p
              style={css(
                "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 24px; color: var(--l-ink)",
              )}
            >
              $14.95
            </p>
            <div style={css("display: flex; gap: 4px; margin-top: 6px")}>
              <span style={css("width: 22px; height: 22px; border-radius: 50%; background: #FF6B4A")} />
              <span style={css("width: 22px; height: 22px; border-radius: 50%; background: #4DA8FF")} />
              <span style={css("width: 22px; height: 22px; border-radius: 50%; background: #2EC4A0")} />
            </div>
          </div>
          <div
            className="sticker"
            aria-hidden="true"
            style={css(
              "--r: 6deg; right: 10px; top: 54px; animation-delay: -2s; background: var(--l-ink); color: var(--l-bg); border-radius: 16px; padding: 12px 16px; box-shadow: 0 14px 34px var(--l-shadow-strong); font-weight: 600; font-size: 15px",
            )}
          >
            Ship 3 orders →
          </div>
          <div
            className="sticker"
            aria-hidden="true"
            style={css(
              "--r: 5deg; left: 30px; top: 300px; animation-delay: -4s; background: var(--l-card); border-radius: 16px; padding: 12px 14px; box-shadow: 0 0 0 1px var(--l-ring), 0 14px 34px var(--l-shadow); width: 170px; text-align: left",
            )}
          >
            <p style={css("margin: 0 0 8px; font-size: 12px; color: var(--l-muted2)")}>Budget</p>{" "}
            <span style={css("display: block; height: 10px; border-radius: 99px; background: var(--l-track)")}>
              <span style={css("display: block; height: 10px; width: 72%; border-radius: 99px; background: #2EC4A0")} />
            </span>{" "}
            <p style={css("margin: 6px 0 0; font-size: 13px; font-weight: 600; color: var(--l-ink)")}>€66 left</p>
          </div>
          <div
            className="sticker"
            aria-hidden="true"
            style={css(
              "--r: -5deg; right: 30px; top: 270px; animation-delay: -1s; background: var(--l-card); border-radius: 16px; padding: 12px 14px; box-shadow: 0 0 0 1px var(--l-ring), 0 14px 34px var(--l-shadow); display: flex; align-items: flex-end; gap: 6px; height: 92px",
            )}
          >
            <span style={css("width: 14px; height: 30px; border-radius: 4px; background: var(--l-bar)")} />
            <span style={css("width: 14px; height: 52px; border-radius: 4px; background: #B9A8FF")} />
            <span style={css("width: 14px; height: 40px; border-radius: 4px; background: #8E77F0")} />
            <span style={css("width: 14px; height: 66px; border-radius: 4px; background: #6E56CF")} />
          </div>
          <p
            style={css(
              "margin: 0; display: inline-flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 4px 8px; font-size: 14.5px; line-height: 1.4; color: var(--l-muted)",
            )}
          >
            <span
              style={css(
                "white-space: nowrap; color: var(--l-accent-text); font-family: var(--font-mono); font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase",
              )}
            >
              Open source · MIT
              <span aria-hidden="true" className="herodot" style={css("color: var(--l-muted2)")}>
                {" ·"}
              </span>
            </span>
            <span>The expression-driven generative UI framework</span>
          </p>
          <h1
            style={css(
              "margin: 0; max-width: 13em; font-family: var(--font-display); font-weight: 700; font-size: clamp(40px, 6vw, 84px); line-height: 1.02; letter-spacing: -0.035em; text-wrap: balance",
            )}
          >
            Every screen, <span style={css("color: var(--l-accent)")}>cast on request.</span>
          </h1>
          <p
            style={css(
              "margin: 0; max-width: 36em; font-size: clamp(18px, 1.5vw, 21px); line-height: 1.55; color: var(--l-text)",
            )}
          >
            <strong>uicast</strong> turns a request into a working screen. The model picks your components and writes
            every value, filter and click as an expression over your data. Users get the screen they asked for.
            Developers ship the parts once.
          </p>
          <div style={css("display: flex; flex-wrap: wrap; justify-content: center; gap: 10px")}>
            <a
              href="#stage"
              style={css(
                "display: inline-flex; align-items: center; gap: 8px; background: #6E56CF; color: #FFFFFF; text-decoration: none; font-weight: 600; border-radius: 999px; padding: 14px 24px; box-shadow: 0 10px 24px rgba(110,86,207,.35)",
              )}
            >
              Watch a screen being cast{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
            </a>{" "}
            <a
              href="https://warehouse.uicast.dev"
              style={css(
                "display: inline-flex; align-items: center; gap: 8px; background: var(--l-card); color: var(--l-ink); text-decoration: none; font-weight: 600; border: 1px solid var(--l-line); border-radius: 999px; padding: 14px 24px",
              )}
            >
              Open the live demo{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          </div>
          <div
            style={css(
              "width: 100%; max-width: 460px; display: flex; flex-direction: column; gap: 8px; margin-top: 4px",
            )}
          >
            <label htmlFor="hero-skill" style={css("font-size: 14px; color: var(--l-muted)")}>
              Building with a coding agent? Give it the skill:
            </label>
            <div
              style={css(
                "display: flex; align-items: stretch; background: var(--l-card); border: 1px solid var(--l-line); border-radius: 14px; overflow: hidden; text-align: left",
              )}
            >
              <input
                id="hero-skill"
                readOnly
                value="npx skills add finom/uicast"
                style={css(
                  "flex: 1 1 auto; min-width: 0; border: 0; background: transparent; padding: 12px 14px; font-family: var(--font-mono); font-size: 14.5px; color: var(--l-ink)",
                )}
              />{" "}
              <button
                type="button"
                onClick={v.copyHeroSkill}
                style={css(
                  "flex: 0 0 auto; border: 0; border-left: 1px solid var(--l-line); background: var(--l-tint); color: var(--l-tint-ink); font-weight: 600; font-size: 14px; padding: 0 16px; min-height: 46px; cursor: pointer",
                )}
              >
                {v.heroSkillLabel}
              </button>
            </div>
          </div>
        </section>
      </div>{" "}
      <div
        id="stage"
        style={css(
          "padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px))",
        )}
      >
        <section
          aria-label="Cast a screen"
          style={css(
            "max-width: 1240px; margin: 0 auto; padding-block: 8px 72px; display: flex; flex-direction: column; gap: 18px",
          )}
        >
          <div
            style={css(
              "display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 14px 24px",
            )}
          >
            <div style={css("display: flex; flex-direction: column; gap: 6px; min-width: 0")}>
              <p
                style={css(
                  "margin: 0; font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--l-accent-text)",
                )}
              >
                ① Whole screens
              </p>
              <h2
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(24px, 2.6vw, 34px); line-height: 1.12; letter-spacing: -0.02em; text-wrap: balance",
                )}
              >
                Pick a request. The screen builds itself.
              </h2>
            </div>
            <div
              role="group"
              aria-label="Who is looking"
              style={css(
                "display: inline-flex; background: var(--l-card); border: 1px solid var(--l-line); border-radius: 999px; padding: 4px; gap: 4px",
              )}
            >
              {v.lenses.map((l: V, lIndex: number) => (
                <Fragment key={lIndex}>
                  <button type="button" onClick={l.pick} aria-pressed={l.pressed} style={css(l.style)}>
                    {l.label}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          <div className="hscroll" style={css("margin-inline: -4px; padding: 4px")}>
            <div className="reqrow" style={css("display: flex; flex-wrap: wrap; gap: 12px")}>
              {v.reqs.map((r: V, rIndex: number) => (
                <Fragment key={rIndex}>
                  <button
                    type="button"
                    className="reqcard"
                    onClick={r.pick}
                    aria-pressed={r.pressed}
                    style={css(r.style)}
                  >
                    <span aria-hidden="true" style={css(r.iconStyle)}>
                      {r.icon}
                    </span>{" "}
                    <span
                      style={css("display: flex; flex-direction: column; gap: 4px; min-width: 0; text-align: left")}
                    >
                      <span
                        style={css(
                          `font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: ${r.tagColor}`,
                        )}
                      >
                        {r.tag}
                      </span>{" "}
                      <span style={css("font-size: 15px; font-weight: 600; line-height: 1.3")}>“{r.text}”</span>
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>{" "}
          <div
            style={css(
              "display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px",
            )}
          >
            <div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 10px")}>
              <span style={css("font-size: 14.5px; color: var(--l-text)")}>Your components:</span>{" "}
              <div
                role="group"
                aria-label="Component style"
                style={css(
                  "display: inline-flex; background: var(--l-card); border: 1px solid var(--l-line); border-radius: 999px; padding: 4px; gap: 4px",
                )}
              >
                {v.themes.map((th: V, thIndex: number) => (
                  <Fragment key={thIndex}>
                    <button type="button" onClick={th.pick} aria-pressed={th.pressed} style={css(th.style)}>
                      {th.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
            <p style={css("margin: 0; font-size: 14px; color: var(--l-muted2); max-width: 34em")}>{v.stageNote}</p>
          </div>{" "}
          <div id="cast-window" style={css(v.t.window)}>
            <div
              style={css(
                `display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; padding: 12px 14px; border-bottom: 1px solid ${v.t.chromeLine}; background: ${v.t.chrome}`,
              )}
            >
              <span aria-hidden="true" style={css("display: inline-flex; gap: 6px; flex: 0 0 auto")}>
                <span style={css("width: 11px; height: 11px; border-radius: 50%; background: #FF6B4A")} />
                <span style={css("width: 11px; height: 11px; border-radius: 50%; background: #FFC53D")} />
                <span style={css("width: 11px; height: 11px; border-radius: 50%; background: #2EC4A0")} />
              </span>{" "}
              <div
                style={css(
                  `flex: 1 1 240px; min-width: 0; display: flex; align-items: center; gap: 8px; background: ${v.t.promptBg}; border: 1px solid ${v.t.chromeLine}; border-radius: 999px; padding: 8px 14px; font-size: 14px; color: ${v.t.promptInk}`,
                )}
              >
                <span aria-hidden="true">✨</span>{" "}
                <span style={css("flex: 1 1 auto; min-width: 0; min-height: 1.4em; line-height: 1.4")}>
                  {v.prompt}
                  {v.typing ? <span className="caret" aria-hidden="true" /> : null}
                </span>
              </div>{" "}
              <span
                role="status"
                style={css(
                  `flex: 0 0 auto; margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: ${v.t.chromeMuted}; white-space: nowrap`,
                )}
              >
                {v.status}
              </span>{" "}
              <button type="button" onClick={v.replay} disabled={v.casting} style={css(v.t.replay)}>
                ↻ Replay
              </button>
            </div>
            <div style={css("display: flex; flex-wrap: wrap; align-items: stretch")}>
              {v.dev ? (
                <aside
                  aria-label="The document the model wrote"
                  className="docpane"
                  style={css(
                    "flex: 1 1 400px; min-width: 0; max-width: 100%; min-height: 320px; background: #15121F; color: #ECEBF3; display: flex; flex-direction: column",
                  )}
                >
                  <div
                    style={css(
                      "padding: 12px 16px; border-bottom: 1px solid #2A2540; display: flex; justify-content: space-between; gap: 10px; align-items: baseline",
                    )}
                  >
                    <span style={css("font-weight: 600; font-size: 14px")}>What the model wrote</span>{" "}
                    <span style={css("font-family: var(--font-mono); font-size: 11.5px; color: #8E87A8")}>
                      {v.docInfo}
                    </span>
                  </div>
                  <div
                    style={css(
                      "flex: 1 1 0; min-height: 0; overflow-y: auto; display: flex; flex-direction: column-reverse",
                    )}
                  >
                    <div style={css("padding: 10px 0 14px; display: flex; flex-direction: column")}>
                      {v.lines.map((ln: V, lnIndex: number) => (
                        <Fragment key={lnIndex}>
                          <div
                            className={ln.cls}
                            style={css(
                              "display: flex; gap: 10px; padding: 3px 16px 3px 10px; font-family: var(--font-mono); font-size: 11.5px; line-height: 1.55",
                            )}
                          >
                            <span style={css("flex: 0 0 22px; text-align: right; color: #5D5778")}>{ln.n}</span>{" "}
                            <code
                              style={css(
                                "flex: 1 1 auto; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere",
                              )}
                            >
                              {ln.segs.map((sg: V, sgIndex: number) => (
                                <Fragment key={sgIndex}>
                                  <span
                                    style={css(sg.style)}
                                    className={sg.tip ? "ltipkey" : undefined}
                                    data-tip={sg.tip}
                                  >
                                    {sg.t}
                                  </span>
                                </Fragment>
                              ))}
                            </code>
                          </div>
                        </Fragment>
                      ))}
                      {v.thinking ? (
                        <div
                          role="status"
                          style={css("padding: 4px 16px 4px 42px; display: flex; gap: 5px")}
                          aria-label="Waiting for the model"
                        >
                          <span
                            style={css(
                              "width: 6px; height: 6px; border-radius: 50%; background: #A795FF; animation: uc-dot 1.2s infinite",
                            )}
                          />
                          <span
                            style={css(
                              "width: 6px; height: 6px; border-radius: 50%; background: #A795FF; animation: uc-dot 1.2s .2s infinite",
                            )}
                          />
                          <span
                            style={css(
                              "width: 6px; height: 6px; border-radius: 50%; background: #A795FF; animation: uc-dot 1.2s .4s infinite",
                            )}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </aside>
              ) : null}
              <main
                aria-label="The generated screen"
                style={css(
                  `flex: 999 1 560px; min-width: 0; position: relative; background: ${v.t.surface}; color: ${v.t.ink}; font-family: ${v.t.font}; padding: clamp(16px, 2.4vw, 28px); min-height: 640px`,
                )}
              >
                {" "}
                {v.is.bill ? (
                  <div style={css("display: flex; flex-direction: column; gap: 16px")}>
                    {v.on.p1 ? (
                      <div style={css("display: flex; flex-direction: column; gap: 14px")}>
                        <div style={css("display: flex; flex-direction: column; gap: 4px")}>
                          {v.e.title ? (
                            <h3 className="pop" style={css(v.t.h3)}>
                              Dinner at Nonna's
                            </h3>
                          ) : null}
                          {v.w.title ? <div className="skel" style={css("height: 30px; width: 45%")} /> : null}
                          {v.e.sub ? (
                            <p className="pop" style={css(`margin: 0; color: ${v.t.muted}; font-size: 14.5px`)}>
                              {v.bill.subtitle}
                            </p>
                          ) : null}
                          {v.w.sub ? <div className="skel" style={css("height: 16px; width: 32%")} /> : null}
                        </div>
                        {v.e.stats ? (
                          <div style={css("display: flex; flex-wrap: wrap; gap: 12px")}>
                            {v.bill.stats.map((s: V, sIndex: number) => (
                              <Fragment key={sIndex}>
                                {s.on ? (
                                  <div className="pop" style={css(v.t.stat)}>
                                    <span style={css(`font-size: 13px; color: ${v.t.muted}`)}>{s.label}</span>
                                    <span style={css(v.t.statValue)}>{s.value}</span>{" "}
                                    {s.showLogic ? <code style={css(v.t.logic)}>{s.expr}</code> : null}
                                  </div>
                                ) : null}
                                {s.wait ? <div className="skel" style={css("flex: 1 1 150px; height: 84px")} /> : null}
                              </Fragment>
                            ))}
                          </div>
                        ) : null}
                        {v.w.stats ? <div className="skel" style={css("height: 84px")} /> : null}
                      </div>
                    ) : null}
                    {v.off.p1 ? <div className="skel" style={css("height: 150px")} /> : null}
                    {v.on.p2 ? (
                      <div className="pop" style={css(v.t.card)}>
                        <div
                          style={css(
                            "display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; align-items: baseline",
                          )}
                        >
                          <p style={css(v.t.cardTitle)}>Who had what</p>
                          <span style={css(`font-size: 13px; color: ${v.t.muted}`)}>
                            Tap a name to add or remove them
                          </span>
                        </div>
                        {v.e.item
                          ? v.bill.items.map((i: V, iIndex: number) => (
                              <Fragment key={iIndex}>
                                <div
                                  className="pop"
                                  style={css(
                                    `display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding-block: 10px; border-top: 1px solid ${v.t.line}`,
                                  )}
                                >
                                  <div
                                    style={css(
                                      "flex: 1 1 200px; min-width: 0; display: flex; align-items: center; gap: 14px",
                                    )}
                                  >
                                    {v.e.item_name ? (
                                      <span
                                        aria-hidden="true"
                                        className="pop"
                                        style={css("font-size: 22px; width: 28px; text-align: center")}
                                      >
                                        {i.emoji}
                                      </span>
                                    ) : null}
                                    <div
                                      style={css(
                                        "flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 3px",
                                      )}
                                    >
                                      {v.e.item_name ? (
                                        <span className="pop" style={css("font-weight: 600; font-size: 15px")}>
                                          {i.name}{" "}
                                          <span style={css(`font-weight: 500; color: ${v.t.muted}`)}>· {i.price}</span>
                                        </span>
                                      ) : null}
                                      {v.w.item_name ? (
                                        <span
                                          className="skel"
                                          style={css("display: block; height: 18px; width: 60%")}
                                        />
                                      ) : null}
                                      {v.e.item_each ? (
                                        <span className="pop" style={css(i.eachStyle)}>
                                          {i.each}
                                        </span>
                                      ) : null}
                                      {v.w.item_each ? (
                                        <span
                                          className="skel"
                                          style={css("display: block; height: 14px; width: 40%")}
                                        />
                                      ) : null}
                                    </div>
                                  </div>
                                  {v.e.item_who ? (
                                    <div
                                      className="pop"
                                      role="group"
                                      aria-label={i.groupLabel}
                                      style={css("display: flex; gap: 6px")}
                                    >
                                      {i.people.map((pp: V, ppIndex: number) => (
                                        <Fragment key={ppIndex}>
                                          <button
                                            type="button"
                                            onClick={pp.toggle}
                                            aria-pressed={pp.pressed}
                                            aria-label={pp.label}
                                            style={css(pp.style)}
                                          >
                                            {pp.initial}
                                          </button>
                                        </Fragment>
                                      ))}
                                    </div>
                                  ) : null}
                                  {v.w.item_who ? (
                                    <span
                                      className="skel"
                                      style={css("display: block; height: 34px; width: 158px; border-radius: 999px")}
                                    />
                                  ) : null}
                                </div>
                              </Fragment>
                            ))
                          : null}
                        {v.w.item ? <div className="skel" style={css("height: 220px")} /> : null}
                      </div>
                    ) : null}
                    {v.off.p2 ? <div className="skel" style={css("height: 330px")} /> : null}
                    <div style={css("display: flex; flex-wrap: wrap; gap: 16px")}>
                      {v.on.p3 ? (
                        <div className="pop" style={css(`${v.t.card}; flex: 1 1 260px; min-width: 0`)}>
                          {v.e.tip ? (
                            <div className="pop" style={css("display: flex; flex-direction: column; gap: 10px")}>
                              <div
                                style={css(
                                  "display: flex; justify-content: space-between; align-items: baseline; gap: 10px",
                                )}
                              >
                                <label htmlFor="tip" style={css(v.t.cardTitle)}>
                                  Tip
                                </label>
                                <span style={css(v.t.big)}>{v.bill.tipText}</span>
                              </div>{" "}
                              <input
                                id="tip"
                                type="range"
                                min="0"
                                max="25"
                                step="1"
                                value={v.bill.tip}
                                onChange={v.bill.setTip}
                                style={css(`accent-color: ${v.t.accent}`)}
                              />
                            </div>
                          ) : null}
                          {v.w.tip ? <div className="skel" style={css("height: 60px")} /> : null}
                          {v.e.tip_quick ? (
                            <div className="pop" style={css("display: flex; gap: 6px; flex-wrap: wrap")}>
                              {v.bill.tips.map((tp: V, tpIndex: number) => (
                                <Fragment key={tpIndex}>
                                  <button
                                    type="button"
                                    onClick={tp.pick}
                                    aria-pressed={tp.pressed}
                                    style={css(tp.style)}
                                  >
                                    {tp.label}
                                  </button>
                                </Fragment>
                              ))}
                            </div>
                          ) : null}
                          {v.w.tip_quick ? (
                            <div className="skel" style={css("height: 34px; width: 70%; border-radius: 999px")} />
                          ) : null}
                        </div>
                      ) : null}
                      {v.off.p3 ? <div className="skel" style={css("flex: 1 1 260px; height: 150px")} /> : null}
                      {v.on.p4 ? (
                        <div
                          style={css(
                            "flex: 2 1 380px; min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px",
                          )}
                        >
                          {v.e.person
                            ? v.bill.people.map((p: V, pIndex: number) => (
                                <Fragment key={pIndex}>
                                  <div className="pop" style={css(v.t.stat)}>
                                    <div style={css("display: flex; align-items: center; gap: 8px")}>
                                      <span aria-hidden="true" style={css(p.avatar)}>
                                        {p.initial}
                                      </span>
                                      <span style={css("font-weight: 600; font-size: 14.5px")}>{p.name}</span>
                                    </div>{" "}
                                    <span style={css(v.t.statValue)}>{p.amount}</span>{" "}
                                    <span style={css(`font-size: 12.5px; color: ${v.t.muted}`)}>{p.note}</span>{" "}
                                    {p.showLogic ? <code style={css(v.t.logic)}>{p.expr}</code> : null}
                                  </div>
                                </Fragment>
                              ))
                            : null}
                          {v.w.person ? (
                            <>
                              <div className="skel" style={css("height: 120px")} />
                              <div className="skel" style={css("height: 120px")} />
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      {v.off.p4 ? <div className="skel" style={css("flex: 2 1 380px; height: 150px")} /> : null}
                    </div>
                    {v.on.p5 ? (
                      <div
                        style={css(
                          "position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 12px",
                        )}
                      >
                        {v.e.send ? (
                          <button
                            className="pop"
                            type="button"
                            onClick={v.bill.send}
                            disabled={v.bill.sendOff}
                            style={css(v.bill.sendStyle)}
                          >
                            {v.bill.sendLabel}
                          </button>
                        ) : null}
                        {v.e.note ? (
                          <span className="pop" style={css(v.bill.noteStyle)}>
                            {v.bill.note}
                          </span>
                        ) : null}
                        {v.w.note ? (
                          <span className="skel" style={css("display: block; height: 18px; width: 240px")} />
                        ) : null}
                        {v.bill.burst ? (
                          <span aria-hidden="true">
                            {v.burst.map((b: V, bIndex: number) => (
                              <Fragment key={bIndex}>
                                <span className={b.cls}>{b.e}</span>
                              </Fragment>
                            ))}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {v.off.p5 ? <div className="skel" style={css("height: 48px; width: 260px")} /> : null}
                  </div>
                ) : null}{" "}
                {v.is.trip ? (
                  <div style={css("display: flex; flex-direction: column; gap: 16px")}>
                    {v.on.p1 ? (
                      <div style={css("display: flex; flex-direction: column; gap: 12px")}>
                        <div
                          style={css(
                            "display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 8px 16px",
                          )}
                        >
                          <div
                            style={css(
                              "flex: 1 1 260px; min-width: 0; display: flex; flex-direction: column; gap: 4px",
                            )}
                          >
                            {v.e.title ? (
                              <h3 className="pop" style={css(v.t.h3)}>
                                A weekend in Lisbon
                              </h3>
                            ) : null}
                            {v.w.title ? <div className="skel" style={css("height: 30px; width: 60%")} /> : null}
                            {v.e.sub ? (
                              <p className="pop" style={css(`margin: 0; color: ${v.t.muted}; font-size: 14.5px`)}>
                                Saturday and Sunday · prices for two
                              </p>
                            ) : null}
                            {v.w.sub ? <div className="skel" style={css("height: 16px; width: 45%")} /> : null}
                          </div>
                          {v.e.left ? (
                            <div className="pop" style={css("text-align: right")}>
                              <span style={css(v.trip.leftStyle)}>{v.trip.left}</span>{" "}
                              {v.trip.showLogic ? (
                                <code style={css(`${v.t.logic}; display: block; text-align: left`)}>
                                  {v.trip.leftExpr}
                                </code>
                              ) : null}
                            </div>
                          ) : null}
                          {v.w.left ? <div className="skel" style={css("height: 40px; width: 150px")} /> : null}
                        </div>
                        {v.e.meter ? (
                          <div className="pop" style={css(`${v.t.card}; gap: 10px`)}>
                            <div
                              style={css("display: flex; justify-content: space-between; gap: 10px; font-size: 14px")}
                            >
                              <span>{v.trip.spentText}</span>
                              {v.e.budget ? (
                                <label className="pop" htmlFor="budget" style={css(`color: ${v.t.muted}`)}>
                                  Budget {v.trip.budgetText}
                                </label>
                              ) : null}
                            </div>{" "}
                            <span
                              style={css(
                                `display: block; height: 14px; border-radius: 99px; background: ${v.t.track}; overflow: hidden`,
                              )}
                            >
                              <span style={css(v.trip.meter)} />
                            </span>{" "}
                            {v.e.budget ? (
                              <input
                                className="pop"
                                id="budget"
                                type="range"
                                min="250"
                                max="700"
                                step="10"
                                value={v.trip.budget}
                                onChange={v.trip.setBudget}
                                style={css(`accent-color: ${v.t.accent}`)}
                              />
                            ) : null}
                            {v.w.budget ? <div className="skel" style={css("height: 20px")} /> : null}
                          </div>
                        ) : null}
                        {v.w.meter ? <div className="skel" style={css("height: 96px")} /> : null}
                      </div>
                    ) : null}
                    {v.off.p1 ? <div className="skel" style={css("height: 190px")} /> : null}
                    {v.on.p2 ? (
                      <div className="pop" style={css(v.t.card)}>
                        <p style={css(v.t.cardTitle)}>Where to stay · 2 nights</p>
                        <div
                          style={css(
                            "display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px",
                          )}
                        >
                          {v.trip.stays.map((s: V, sIndex: number) => (
                            <Fragment key={sIndex}>
                              <button type="button" onClick={s.pick} aria-pressed={s.pressed} style={css(s.style)}>
                                <span aria-hidden="true" style={css("font-size: 22px")}>
                                  {s.emoji}
                                </span>
                                <span style={css("font-weight: 600")}>{s.label}</span>
                                <span style={css("font-size: 13px; opacity: .8")}>{s.price}</span>
                              </button>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {v.off.p2 ? <div className="skel" style={css("height: 140px")} /> : null}
                    <div style={css("display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start")}>
                      {v.on.p3 ? (
                        <div className="pop" style={css(`${v.t.card}; flex: 3 1 380px; min-width: 0`)}>
                          <div
                            style={css(
                              "display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px",
                            )}
                          >
                            <p style={css(v.t.cardTitle)}>Things to do</p>
                            {v.e.day ? (
                              <div className="pop" role="group" aria-label="Day" style={css("display: flex; gap: 6px")}>
                                {v.trip.days.map((d: V, dIndex: number) => (
                                  <Fragment key={dIndex}>
                                    <button
                                      type="button"
                                      onClick={d.pick}
                                      aria-pressed={d.pressed}
                                      style={css(d.style)}
                                    >
                                      {d.label}
                                    </button>
                                  </Fragment>
                                ))}
                              </div>
                            ) : null}
                            {v.w.day ? (
                              <span
                                className="skel"
                                style={css("display: block; height: 34px; width: 120px; border-radius: 999px")}
                              />
                            ) : null}
                          </div>
                          {v.e.act
                            ? v.trip.acts.map((a: V, aIndex: number) => (
                                <Fragment key={aIndex}>
                                  <label className="pop" style={css(a.style)}>
                                    <input
                                      type="checkbox"
                                      checked={a.checked}
                                      onChange={a.toggle}
                                      style={css(
                                        `width: 18px; height: 18px; flex: 0 0 auto; accent-color: ${v.t.accent}`,
                                      )}
                                    />{" "}
                                    <span aria-hidden="true" style={css("font-size: 24px")}>
                                      {a.emoji}
                                    </span>{" "}
                                    <span
                                      style={css("flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column")}
                                    >
                                      <span style={css("font-weight: 600; font-size: 15px")}>{a.name}</span>
                                      <span style={css(`font-size: 13px; color: ${v.t.muted}`)}>{a.meta}</span>
                                    </span>{" "}
                                    <span style={css("font-weight: 600; font-variant-numeric: tabular-nums")}>
                                      {a.cost}
                                    </span>
                                  </label>
                                </Fragment>
                              ))
                            : null}
                          {v.w.act ? <div className="skel" style={css("height: 200px")} /> : null}
                          {v.trip.clash ? (
                            v.e.clash ? (
                              <p className="pop" style={css(v.t.alertWarn)}>
                                {v.trip.clashText}
                              </p>
                            ) : null
                          ) : null}
                        </div>
                      ) : null}
                      {v.off.p3 ? <div className="skel" style={css("flex: 3 1 380px; height: 320px")} /> : null}
                      {v.on.p4 ? (
                        <div className="pop" style={css(`${v.t.card}; flex: 2 1 260px; min-width: 0`)}>
                          <p style={css(v.t.cardTitle)}>Your plan</p>
                          {v.trip.plan.map((pl: V, plIndex: number) => (
                            <Fragment key={plIndex}>
                              <div style={css("display: flex; gap: 10px; align-items: baseline; font-size: 14px")}>
                                <span
                                  style={css(
                                    `font-family: var(--font-mono); font-size: 12px; color: ${v.t.muted}; flex: 0 0 72px`,
                                  )}
                                >
                                  {pl.when}
                                </span>
                                <span>
                                  {pl.emoji} {pl.name}
                                </span>
                              </div>
                            </Fragment>
                          ))}
                          {v.trip.empty ? (
                            <p style={css(`margin: 0; color: ${v.t.muted}; font-size: 14px`)}>Nothing picked yet.</p>
                          ) : null}
                        </div>
                      ) : null}
                      {v.off.p4 ? <div className="skel" style={css("flex: 2 1 260px; height: 220px")} /> : null}
                    </div>
                    {v.on.p5 ? (
                      <div
                        style={css(
                          "position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 12px",
                        )}
                      >
                        {v.e.save ? (
                          <button
                            className="pop"
                            type="button"
                            onClick={v.trip.save}
                            disabled={v.trip.saveOff}
                            style={css(v.trip.saveStyle)}
                          >
                            {v.trip.saveLabel}
                          </button>
                        ) : null}
                        {v.e.note ? (
                          <span className="pop" style={css(v.trip.noteStyle)}>
                            {v.trip.note}
                          </span>
                        ) : null}
                        {v.w.note ? (
                          <span className="skel" style={css("display: block; height: 18px; width: 220px")} />
                        ) : null}
                        {v.trip.burst ? (
                          <span aria-hidden="true">
                            {v.burst.map((b: V, bIndex: number) => (
                              <Fragment key={bIndex}>
                                <span className={b.cls}>{b.e}</span>
                              </Fragment>
                            ))}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {v.off.p5 ? <div className="skel" style={css("height: 48px; width: 220px")} /> : null}
                  </div>
                ) : null}{" "}
                {v.is.habits ? (
                  <div style={css("display: flex; flex-direction: column; gap: 16px")}>
                    {v.on.p1 ? (
                      <div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 18px 24px")}>
                        {v.e.ring ? (
                          <div
                            className="pop"
                            style={css("position: relative; width: 132px; height: 132px; flex: 0 0 auto")}
                          >
                            <svg
                              width="132"
                              height="132"
                              viewBox="0 0 132 132"
                              role="img"
                              aria-label={v.habits.ringLabel}
                            >
                              <circle cx="66" cy="66" r="54" fill="none" stroke={v.t.track} strokeWidth="14" />
                              <circle
                                cx="66"
                                cy="66"
                                r="54"
                                fill="none"
                                stroke={v.t.accent}
                                strokeWidth="14"
                                strokeLinecap="round"
                                strokeDasharray={v.habits.dash}
                                transform="rotate(-90 66 66)"
                                style={css("transition: stroke-dasharray .5s ease")}
                              />
                            </svg>{" "}
                            <span
                              style={css(
                                "position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center",
                              )}
                            >
                              <span style={css(v.t.statValue)}>{v.habits.pct}</span>
                              <span style={css(`font-size: 12px; color: ${v.t.muted}`)}>this week</span>
                            </span>
                          </div>
                        ) : null}
                        {v.w.ring ? (
                          <div
                            className="skel"
                            style={css("width: 132px; height: 132px; border-radius: 50%; flex: 0 0 auto")}
                          />
                        ) : null}
                        <div
                          style={css("flex: 1 1 260px; min-width: 0; display: flex; flex-direction: column; gap: 6px")}
                        >
                          {v.e.title ? (
                            <h3 className="pop" style={css(v.t.h3)}>
                              This week
                            </h3>
                          ) : null}
                          {v.w.title ? <div className="skel" style={css("height: 30px; width: 40%")} /> : null}
                          {v.e.message ? (
                            <>
                              <p className="pop" style={css("margin: 0; font-size: 15.5px")}>
                                {v.habits.message}
                              </p>
                              {v.habits.showLogic ? <code style={css(v.t.logic)}>{v.habits.expr}</code> : null}
                            </>
                          ) : null}
                          {v.w.message ? <div className="skel" style={css("height: 18px; width: 75%")} /> : null}
                        </div>
                      </div>
                    ) : null}
                    {v.off.p1 ? <div className="skel" style={css("height: 140px")} /> : null}
                    {v.on.p2 ? (
                      <div className="pop" style={css(v.t.card)}>
                        <p style={css(v.t.cardTitle)}>Today</p>
                        <div
                          style={css(
                            "display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px",
                          )}
                        >
                          {v.e.check
                            ? v.habits.today.map((h: V, hIndex: number) => (
                                <Fragment key={hIndex}>
                                  <button
                                    className="pop"
                                    type="button"
                                    onClick={h.toggle}
                                    aria-pressed={h.pressed}
                                    style={css(h.style)}
                                  >
                                    <span aria-hidden="true" style={css("font-size: 22px")}>
                                      {h.icon}
                                    </span>
                                    <span
                                      style={css(
                                        "flex: 1 1 auto; text-align: left; font-weight: 600; font-size: 14.5px; line-height: 1.3",
                                      )}
                                    >
                                      {h.name}
                                    </span>
                                    <span aria-hidden="true" style={css(h.checkStyle)}>
                                      ✓
                                    </span>
                                  </button>
                                </Fragment>
                              ))
                            : null}
                          {v.w.check ? (
                            <>
                              <div className="skel" style={css("height: 56px")} />
                              <div className="skel" style={css("height: 56px")} />
                              <div className="skel" style={css("height: 56px")} />
                            </>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {v.off.p2 ? <div className="skel" style={css("height: 170px")} /> : null}
                    {v.on.p3 ? (
                      <div className="pop" style={css(`${v.t.card}; overflow-x: auto`)}>
                        <p style={css(v.t.cardTitle)}>Day by day</p>
                        <div
                          style={css(
                            "display: grid; grid-template-columns: minmax(150px, 1.6fr) repeat(7, minmax(34px, 1fr)) minmax(64px, .8fr); gap: 8px 6px; align-items: center; min-width: 560px",
                          )}
                        >
                          <span />{" "}
                          {v.habits.dayHeads.map((dh: V, dhIndex: number) => (
                            <Fragment key={dhIndex}>
                              <span style={css(dh.style)}>{dh.label}</span>
                            </Fragment>
                          ))}{" "}
                          <span style={css(`font-size: 12px; color: ${v.t.muted}; text-align: right`)}>Streak</span>{" "}
                          {v.e.row
                            ? v.habits.rows.map((hr: V, hrIndex: number) => (
                                <Fragment key={hrIndex}>
                                  <span
                                    className="pop"
                                    style={css(
                                      "font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis",
                                    )}
                                  >
                                    {hr.icon} {hr.name}
                                  </span>{" "}
                                  {hr.cells.map((c: V, cIndex: number) => (
                                    <Fragment key={cIndex}>
                                      {v.e.row_days ? (
                                        <button
                                          className="pop"
                                          type="button"
                                          onClick={c.toggle}
                                          disabled={c.future}
                                          aria-pressed={c.pressed}
                                          aria-label={c.label}
                                          style={css(c.style)}
                                        >
                                          {c.mark}
                                        </button>
                                      ) : null}
                                      {v.w.row_days ? (
                                        <span
                                          className="skel"
                                          style={css(
                                            "display: block; justify-self: center; width: 30px; height: 30px; border-radius: 50%",
                                          )}
                                        />
                                      ) : null}
                                    </Fragment>
                                  ))}
                                  {v.e.row_streak ? (
                                    <span className="pop" style={css(hr.streakStyle)}>
                                      {hr.streak}
                                    </span>
                                  ) : null}
                                  {v.w.row_streak ? (
                                    <span
                                      className="skel"
                                      style={css("display: block; justify-self: end; width: 40px; height: 18px")}
                                    />
                                  ) : null}
                                </Fragment>
                              ))
                            : null}
                        </div>
                        {v.w.row ? <div className="skel" style={css("height: 180px")} /> : null}
                      </div>
                    ) : null}
                    {v.off.p3 ? <div className="skel" style={css("height: 270px")} /> : null}
                    {v.on.p4 ? (
                      <div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 8px")}>
                        {v.e.ideas_label ? (
                          <span className="pop" style={css(`font-size: 14px; color: ${v.t.muted}`)}>
                            Add a habit:
                          </span>
                        ) : null}
                        {v.e.idea
                          ? v.habits.ideas.map((idea: V, ideaIndex: number) => (
                              <Fragment key={ideaIndex}>
                                <button className="pop" type="button" onClick={idea.add} style={css(idea.style)}>
                                  + {idea.icon} {idea.name}
                                </button>
                              </Fragment>
                            ))
                          : null}
                        {v.w.idea ? (
                          <span
                            className="skel"
                            style={css("display: block; height: 34px; width: 300px; border-radius: 999px")}
                          />
                        ) : null}
                        {v.habits.allAdded ? (
                          <span style={css(`font-size: 14px; color: ${v.t.muted}`)}>All ideas added.</span>
                        ) : null}
                      </div>
                    ) : null}
                    {v.off.p4 ? <div className="skel" style={css("height: 40px; width: 70%")} /> : null}
                  </div>
                ) : null}{" "}
                {v.is.orders ? (
                  <div style={css("display: flex; flex-direction: column; gap: 16px")}>
                    {v.on.p1 ? (
                      <div style={css("display: flex; flex-direction: column; gap: 12px")}>
                        <div style={css("display: flex; flex-direction: column; gap: 4px")}>
                          {v.e.title ? (
                            <h3 className="pop" style={css(v.t.h3)}>
                              Orders to ship
                            </h3>
                          ) : null}
                          {v.w.title ? <div className="skel" style={css("height: 30px; width: 40%")} /> : null}
                          {v.e.sub ? (
                            <p className="pop" style={css(`margin: 0; color: ${v.t.muted}; font-size: 14.5px`)}>
                              Placed since Monday · a made-up store
                            </p>
                          ) : null}
                          {v.w.sub ? <div className="skel" style={css("height: 16px; width: 35%")} /> : null}
                        </div>
                        {v.e.stats ? (
                          <div style={css("display: flex; flex-wrap: wrap; gap: 12px")}>
                            {v.ord.stats.map((s: V, sIndex: number) => (
                              <Fragment key={sIndex}>
                                {s.on ? (
                                  <div className="pop" style={css(v.t.stat)}>
                                    <span style={css(`font-size: 13px; color: ${v.t.muted}`)}>{s.label}</span>
                                    <span style={css(v.t.statValue)}>{s.value}</span>{" "}
                                    {s.showLogic ? <code style={css(v.t.logic)}>{s.expr}</code> : null}
                                  </div>
                                ) : null}
                                {s.wait ? <div className="skel" style={css("flex: 1 1 150px; height: 84px")} /> : null}
                              </Fragment>
                            ))}
                          </div>
                        ) : null}
                        {v.w.stats ? <div className="skel" style={css("height: 84px")} /> : null}
                      </div>
                    ) : null}
                    {v.off.p1 ? <div className="skel" style={css("height: 150px")} /> : null}
                    {v.on.p2 ? (
                      <div style={css("display: flex; flex-wrap: wrap; gap: 10px; align-items: center")}>
                        {v.e.search ? (
                          <input
                            className="pop"
                            type="search"
                            aria-label="Search orders"
                            placeholder="Search customer, city or #id"
                            value={v.ord.q}
                            onChange={v.ord.setQ}
                            style={css(`${v.t.input}; flex: 1 1 220px; min-width: 0`)}
                          />
                        ) : null}
                        {v.w.search ? <div className="skel" style={css("flex: 1 1 220px; height: 44px")} /> : null}
                        {v.e.tabs ? (
                          <div
                            className="pop"
                            role="group"
                            aria-label="Status"
                            style={css("display: flex; gap: 6px; flex-wrap: wrap")}
                          >
                            {v.ord.tabs.map((tb: V, tbIndex: number) => (
                              <Fragment key={tbIndex}>
                                <button type="button" onClick={tb.pick} aria-pressed={tb.pressed} style={css(tb.style)}>
                                  {tb.label}
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        ) : null}
                        {v.w.tabs ? (
                          <span
                            className="skel"
                            style={css("display: block; height: 36px; width: 230px; border-radius: 999px")}
                          />
                        ) : null}
                      </div>
                    ) : null}
                    {v.off.p2 ? <div className="skel" style={css("height: 46px")} /> : null}
                    {v.on.p3 ? (
                      <div className="pop" style={css(`${v.t.card}; padding: 6px 0; gap: 0; overflow-x: auto`)}>
                        <div style={css("min-width: 560px")}>
                          <div style={css(v.t.headRow)}>
                            <input
                              type="checkbox"
                              aria-label="Select every order to ship"
                              checked={v.ord.allOn}
                              onChange={v.ord.toggleAll}
                              style={css(`width: 17px; height: 17px; accent-color: ${v.t.accent}`)}
                            />{" "}
                            <span>Customer</span>
                            <span>Placed</span>
                            <span style={css("text-align: right")}>Total</span>
                            <span>Status</span>
                            <span />
                          </div>
                          {v.e.row
                            ? v.ord.rows.map((o: V, oIndex: number) => (
                                <Fragment key={oIndex}>
                                  <div className="pop" style={css(o.rowStyle)}>
                                    {v.e.c_pick ? (
                                      <input
                                        className="pop"
                                        type="checkbox"
                                        aria-label={o.pickLabel}
                                        checked={o.picked}
                                        disabled={o.done}
                                        onChange={o.togglePick}
                                        style={css(`width: 17px; height: 17px; accent-color: ${v.t.accent}`)}
                                      />
                                    ) : null}
                                    {v.w.c_pick ? (
                                      <span
                                        className="skel"
                                        style={css("display: block; width: 17px; height: 17px; border-radius: 4px")}
                                      />
                                    ) : null}
                                    {v.e.c_customer ? (
                                      <span
                                        className="pop"
                                        style={css("display: flex; flex-direction: column; min-width: 0")}
                                      >
                                        <span style={css("font-weight: 600; font-size: 14.5px")}>{o.customer}</span>
                                        <span style={css(`font-size: 12.5px; color: ${v.t.muted}`)}>
                                          #{o.id} · {o.city}
                                        </span>
                                      </span>
                                    ) : null}
                                    {v.w.c_customer ? (
                                      <span className="skel" style={css("display: block; height: 34px; width: 70%")} />
                                    ) : null}
                                    {v.e.c_placed ? (
                                      <span className="pop" style={css("font-size: 14px")}>
                                        {o.placed}
                                      </span>
                                    ) : null}
                                    {v.w.c_placed ? (
                                      <span className="skel" style={css("display: block; height: 16px; width: 70%")} />
                                    ) : null}
                                    {v.e.c_total ? (
                                      <span
                                        className="pop"
                                        style={css(
                                          "text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; font-size: 14.5px",
                                        )}
                                      >
                                        {o.total}
                                      </span>
                                    ) : null}
                                    {v.w.c_total ? (
                                      <span
                                        className="skel"
                                        style={css("display: block; height: 16px; width: 60%; justify-self: end")}
                                      />
                                    ) : null}
                                    {v.e.c_status ? (
                                      <span className="pop">
                                        <span style={css(o.badge)}>{o.status}</span>
                                      </span>
                                    ) : null}
                                    {v.w.c_status ? (
                                      <span
                                        className="skel"
                                        style={css("display: block; height: 20px; width: 64px; border-radius: 999px")}
                                      />
                                    ) : null}
                                    {v.e.c_ship ? (
                                      <span className="pop" style={css("text-align: right")}>
                                        {o.canShip ? (
                                          <button type="button" onClick={o.ship} style={css(v.t.btnSm)}>
                                            Ship
                                          </button>
                                        ) : null}
                                      </span>
                                    ) : null}
                                    {v.w.c_ship ? (
                                      <span
                                        className="skel"
                                        style={css("display: block; height: 30px; width: 54px; justify-self: end")}
                                      />
                                    ) : null}
                                  </div>
                                </Fragment>
                              ))
                            : null}
                          {v.w.row ? <div className="skel" style={css("height: 220px; margin: 8px 16px")} /> : null}
                          {v.ord.none ? (
                            <p style={css(`margin: 0; padding: 26px; text-align: center; color: ${v.t.muted}`)}>
                              {v.ord.noneText}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {v.off.p3 ? <div className="skel" style={css("height: 330px")} /> : null}
                    {v.on.p4 ? (
                      <div
                        style={css(
                          "position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 12px",
                        )}
                      >
                        {v.e.bulk ? (
                          <button
                            className="pop"
                            type="button"
                            onClick={v.ord.shipPicked}
                            disabled={v.ord.bulkOff}
                            style={css(v.ord.bulkStyle)}
                          >
                            {v.ord.bulkLabel}
                          </button>
                        ) : null}
                        {v.e.note ? (
                          <span className="pop" style={css(v.ord.noteStyle)}>
                            {v.ord.note}
                          </span>
                        ) : null}
                        {v.w.note ? (
                          <span className="skel" style={css("display: block; height: 18px; width: 240px")} />
                        ) : null}
                        {v.e.bulk ? (
                          v.ord.showLogic ? (
                            <code style={css(v.t.logic)}>{v.ord.bulkExpr}</code>
                          ) : null
                        ) : null}
                      </div>
                    ) : null}
                    {v.off.p4 ? <div className="skel" style={css("height: 48px; width: 240px")} /> : null}
                  </div>
                ) : null}
                {v.thinkingScreen ? (
                  <div
                    style={css(
                      "position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none",
                    )}
                  >
                    <span
                      style={css(
                        `display: inline-flex; align-items: center; gap: 10px; background: ${v.t.chrome}; color: ${v.t.ink}; border: 1px solid ${v.t.chromeLine}; border-radius: 999px; padding: 10px 18px; font-size: 14px; box-shadow: 0 10px 30px rgba(40,20,90,.15)`,
                      )}
                    >
                      <span
                        style={css(
                          `width: 7px; height: 7px; border-radius: 50%; background: ${v.t.accent}; animation: uc-dot 1.2s infinite`,
                        )}
                      />
                      <span
                        style={css(
                          `width: 7px; height: 7px; border-radius: 50%; background: ${v.t.accent}; animation: uc-dot 1.2s .2s infinite`,
                        )}
                      />
                      <span
                        style={css(
                          `width: 7px; height: 7px; border-radius: 50%; background: ${v.t.accent}; animation: uc-dot 1.2s .4s infinite`,
                        )}
                      />{" "}
                      The model is writing the screen
                    </span>
                  </div>
                ) : null}
              </main>
            </div>
            {v.dev ? (
              <div
                style={css(
                  "display: flex; flex-wrap: wrap; gap: 0; background: #1B1728; color: #ECEBF3; border-top: 1px solid #2A2540",
                )}
              >
                <div
                  style={css(
                    "flex: 1 1 380px; min-width: 0; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid #2A2540",
                  )}
                >
                  <p style={css("margin: 0; font-weight: 600; font-size: 14px")}>
                    Functions this screen calls{" "}
                    <span style={css("font-weight: 400; color: #8E87A8")}>· written by your developers</span>
                  </p>
                  <div style={css("display: flex; flex-wrap: wrap; gap: 6px")}>
                    {v.fns.map((f: V, fIndex: number) => (
                      <Fragment key={fIndex}>
                        <button type="button" onClick={f.pick} aria-pressed={f.pressed} style={css(f.style)}>
                          {f.name}()
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <pre
                    style={css(
                      "margin: 0; background: #15121F; border: 1px solid #2A2540; border-radius: 12px; padding: 14px; font-family: var(--font-mono); font-size: 12px; line-height: 1.6; white-space: pre; overflow-x: auto; color: #DAD8EA",
                    )}
                  >
                    {v.fnCode}
                  </pre>
                </div>
                <div
                  style={css(
                    "flex: 1 1 300px; min-width: 0; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px",
                  )}
                >
                  <p style={css("margin: 0; font-weight: 600; font-size: 14px")}>
                    Components it used <span style={css("font-weight: 400; color: #8E87A8")}>· from your catalog</span>
                  </p>
                  <div style={css("display: flex; flex-wrap: wrap; gap: 6px")}>
                    {v.used.map((u: V, uIndex: number) => (
                      <Fragment key={uIndex}>
                        <span
                          style={css(
                            "font-family: var(--font-mono); font-size: 12.5px; background: #262038; border: 1px solid #3A3255; border-radius: 8px; padding: 4px 9px",
                          )}
                        >
                          {u.name} <span style={css("color: #A795FF")}>×{u.n}</span>
                        </span>
                      </Fragment>
                    ))}
                  </div>
                  <p style={css("margin: 0; font-size: 13.5px; line-height: 1.55; color: #A3A0B8")}>{v.devNote}</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>{" "}
      <div
        style={css(
          "padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); background: var(--l-band)",
        )}
      >
        <section
          aria-label="Chat answers"
          style={css(
            "max-width: 1240px; margin: 0 auto; padding-block: 80px; display: flex; flex-wrap: wrap; align-items: center; gap: 40px 64px",
          )}
        >
          <div style={css("flex: 1 1 380px; min-width: 0; display: flex; flex-direction: column; gap: 18px")}>
            <p
              style={css(
                "margin: 0; font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--l-accent-text)",
              )}
            >
              ② Chat answers
            </p>
            <h2
              style={css(
                "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(28px, 3.4vw, 46px); line-height: 1.08; letter-spacing: -0.025em; text-wrap: balance",
              )}
            >
              Ask a question, get a tool back.
            </h2>
            <p style={css("margin: 0; font-size: 18px; line-height: 1.6; color: var(--l-text)")}>
              The answer is not a paragraph you read and then go act on. It is a small working screen: a poll you vote
              in, a chart with a slider, a refund form that asks before it refunds.
            </p>
            <div style={css("display: flex; flex-direction: column; gap: 12px")}>
              <div style={css("display: flex; gap: 14px; align-items: flex-start")}>
                <span
                  aria-hidden="true"
                  style={css(
                    "flex: 0 0 auto; width: 34px; height: 34px; border-radius: 12px; background: var(--l-tile); display: inline-flex; align-items: center; justify-content: center; font-size: 18px",
                  )}
                >
                  🙂
                </span>
                <p style={css("margin: 0; font-size: 16px; line-height: 1.55; color: var(--l-text)")}>
                  <strong style={css("color: var(--l-ink)")}>Your users</strong> stay in the conversation. The buttons
                  in an answer do the thing, through your functions.
                </p>
              </div>
              <div style={css("display: flex; gap: 14px; align-items: flex-start")}>
                <span
                  aria-hidden="true"
                  style={css(
                    "flex: 0 0 auto; width: 34px; height: 34px; border-radius: 12px; background: var(--l-tile-strong); color: var(--l-tile-strong-ink); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 13px",
                  )}
                >
                  {"</>"}
                </span>
                <p style={css("margin: 0; font-size: 16px; line-height: 1.55; color: var(--l-text)")}>
                  <strong style={css("color: var(--l-ink)")}>Your developers</strong> drop one plugin into a Markdown
                  chat. The UI rides in code fences, and every block in a conversation shares one state. Tap{" "}
                  <strong>{"</>"}</strong> under an answer to see its document.
                </p>
              </div>
            </div>
          </div>
          <div style={css("flex: 0 1 400px; min-width: 0; width: 100%; max-width: 400px; margin-inline: auto")}>
            <div
              style={css(
                "background: var(--l-phone); border-radius: 48px; padding: 10px; box-shadow: 0 30px 60px rgba(60,40,120,.28)",
              )}
            >
              <div
                id="chat-phone"
                style={css(
                  "position: relative; height: 760px; border-radius: 38px; overflow: hidden; background: #FBF8F4; color: #1D1730; display: flex; flex-direction: column",
                )}
              >
                <div
                  style={css(
                    "display: flex; align-items: center; gap: 10px; padding: 18px 18px 12px; background: #FFFFFF; border-bottom: 1px solid #EFE7DD",
                  )}
                >
                  <span
                    aria-hidden="true"
                    style={css(
                      "width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #8E77F0, #6E56CF); display: inline-flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 16px",
                    )}
                  >
                    ✦
                  </span>{" "}
                  <span style={css("display: flex; flex-direction: column; line-height: 1.2")}>
                    <span style={css("font-weight: 600; font-size: 15px")}>Assistant</span>
                    <span style={css("font-size: 12px; color: #2EA37F")}>● in your app</span>
                  </span>
                </div>
                <div
                  id="chat-thread"
                  style={css(
                    "flex: 1 1 0; min-height: 0; overflow-y: auto; display: flex; flex-direction: column-reverse",
                  )}
                >
                  <div style={css("padding: 14px 14px 18px; display: flex; flex-direction: column; gap: 12px")}>
                    {v.chat.map((m: V, mIndex: number) => (
                      <Fragment key={mIndex}>
                        <div
                          style={css(
                            "align-self: flex-end; max-width: 82%; background: #6E56CF; color: #FFFFFF; border-radius: 20px 20px 6px 20px; padding: 10px 14px; font-size: 15px; line-height: 1.4",
                          )}
                        >
                          {m.q}
                        </div>
                        {m.thinking ? (
                          <div
                            role="status"
                            aria-label="Writing an answer"
                            style={css(
                              "align-self: flex-start; display: flex; gap: 5px; padding: 12px 14px; background: #FFFFFF; border: 1px solid #EFE7DD; border-radius: 20px 20px 20px 6px",
                            )}
                          >
                            <span
                              style={css(
                                "width: 7px; height: 7px; border-radius: 50%; background: #B9A8FF; animation: uc-dot 1.2s infinite",
                              )}
                            />
                            <span
                              style={css(
                                "width: 7px; height: 7px; border-radius: 50%; background: #8E77F0; animation: uc-dot 1.2s .2s infinite",
                              )}
                            />
                            <span
                              style={css(
                                "width: 7px; height: 7px; border-radius: 50%; background: #6E56CF; animation: uc-dot 1.2s .4s infinite",
                              )}
                            />
                          </div>
                        ) : null}
                        {m.hasText ? (
                          <p style={css("margin: 0; font-size: 15px; line-height: 1.5")}>
                            {m.text}
                            {m.typing ? <span className="caret" aria-hidden="true" /> : null}
                          </p>
                        ) : null}
                        {m.isCoffee ? (
                          <div style={css("display: flex; flex-direction: column; gap: 10px")}>
                            {m.e.root ? (
                              <div className="pop" style={css(`${v.c.card}; gap: 10px`)}>
                                {m.e.total ? (
                                  <div
                                    className="pop"
                                    style={css(
                                      "display: flex; justify-content: space-between; align-items: flex-end; gap: 8px",
                                    )}
                                  >
                                    <div style={css("display: flex; flex-direction: column")}>
                                      <span style={css(`font-size: 12.5px; color: ${v.c.muted}`)}>
                                        Coffee, last 4 weeks
                                      </span>
                                      <span style={css(v.c.statValue)}>{v.coffee.total}</span>
                                    </div>
                                    <span style={css(v.coffee.changeStyle)}>{v.coffee.change}</span>
                                  </div>
                                ) : null}
                                {m.w.total ? <div className="skel" style={css("height: 52px; width: 60%")} /> : null}
                                {m.e.chart ? (
                                  <div
                                    className="pop"
                                    aria-hidden="true"
                                    style={css(
                                      "display: flex; align-items: flex-end; gap: 10px; height: 96px; padding-top: 6px",
                                    )}
                                  >
                                    {v.coffee.bars.map((cb: V, cbIndex: number) => (
                                      <Fragment key={cbIndex}>
                                        <div
                                          style={css(
                                            "flex: 1 1 0; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end",
                                          )}
                                        >
                                          <div
                                            style={css(
                                              "display: flex; align-items: flex-end; gap: 3px; width: 100%; justify-content: center; flex: 1 1 auto",
                                            )}
                                          >
                                            <span style={css(cb.prevStyle)} />
                                            <span style={css(cb.style)} />
                                          </div>{" "}
                                          <span style={css(`font-size: 11px; color: ${v.c.muted}`)}>{cb.label}</span>
                                        </div>
                                      </Fragment>
                                    ))}
                                  </div>
                                ) : null}
                                {m.w.chart ? <div className="skel" style={css("height: 96px")} /> : null}
                                {m.e.compare ? (
                                  <label
                                    className="pop"
                                    style={css("display: flex; align-items: center; gap: 8px; font-size: 13.5px")}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={v.coffee.compare}
                                      onChange={v.coffee.toggleCompare}
                                      style={css("width: 16px; height: 16px")}
                                    />
                                    Compare with the 4 weeks before
                                  </label>
                                ) : null}
                                {m.w.compare ? <div className="skel" style={css("height: 18px; width: 70%")} /> : null}
                              </div>
                            ) : null}
                            {m.w.root ? <div className="skel" style={css("height: 210px")} /> : null}
                            {m.e.limit ? (
                              <div className="pop" style={css(`${v.c.card}; gap: 8px`)}>
                                <div
                                  style={css(
                                    "display: flex; justify-content: space-between; align-items: baseline; gap: 8px",
                                  )}
                                >
                                  <label htmlFor="limit" style={css("font-weight: 600; font-size: 14px")}>
                                    Daily limit
                                  </label>
                                  <span style={css("font-weight: 700; font-size: 16px")}>{v.coffee.limitText}</span>
                                </div>{" "}
                                <input
                                  id="limit"
                                  type="range"
                                  min="2"
                                  max="7"
                                  step="0.5"
                                  value={v.coffee.limit}
                                  onChange={v.coffee.setLimit}
                                />{" "}
                                {m.e.verdict ? (
                                  <p className="pop" style={css("margin: 0; font-size: 14px; line-height: 1.45")}>
                                    {v.coffee.verdict}
                                  </p>
                                ) : null}
                                {m.w.verdict ? <div className="skel" style={css("height: 36px")} /> : null}
                              </div>
                            ) : null}
                            {m.w.limit ? <div className="skel" style={css("height: 110px")} /> : null}
                          </div>
                        ) : null}
                        {m.isLunch ? (
                          <>
                            {m.e.root ? (
                              <div className="pop" style={css(`${v.c.card}; gap: 10px; position: relative`)}>
                                <p style={css("margin: 0; font-weight: 600; font-size: 15px")}>
                                  Lunch on Friday · team of 6
                                </p>
                                {m.e.option
                                  ? v.lunch.opts.map((lo: V, loIndex: number) => (
                                      <Fragment key={loIndex}>
                                        <button
                                          className="pop"
                                          type="button"
                                          onClick={lo.vote}
                                          aria-pressed={lo.pressed}
                                          disabled={v.lunch.booked}
                                          style={css(lo.style)}
                                        >
                                          <span
                                            style={css(
                                              "display: flex; justify-content: space-between; gap: 8px; width: 100%; font-size: 14px",
                                            )}
                                          >
                                            <span style={css("font-weight: 600")}>{lo.time}</span>
                                            <span>{lo.who}</span>
                                          </span>{" "}
                                          <span
                                            style={css(
                                              "display: block; width: 100%; height: 6px; border-radius: 99px; background: #F1ECE6",
                                            )}
                                          >
                                            <span style={css(lo.bar)} />
                                          </span>
                                        </button>
                                      </Fragment>
                                    ))
                                  : null}
                                {m.w.option ? (
                                  <>
                                    <div className="skel" style={css("height: 62px")} />
                                    <div className="skel" style={css("height: 62px")} />
                                    <div className="skel" style={css("height: 62px")} />
                                  </>
                                ) : null}
                                {m.e.book ? (
                                  <button
                                    className="pop"
                                    type="button"
                                    onClick={v.lunch.book}
                                    disabled={v.lunch.bookOff}
                                    style={css(v.lunch.bookStyle)}
                                  >
                                    {v.lunch.bookLabel}
                                  </button>
                                ) : null}
                                {m.w.book ? (
                                  <div className="skel" style={css("height: 46px; border-radius: 999px")} />
                                ) : null}
                                {v.lunch.booked ? (
                                  <p className="pop" style={css(v.c.alertOk)}>
                                    {v.lunch.bookedText}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                            {m.w.root ? <div className="skel" style={css("height: 250px")} /> : null}
                          </>
                        ) : null}
                        {m.isWater ? (
                          <>
                            {m.e.root ? (
                              <div className="pop" style={css(`${v.c.card}; gap: 10px`)}>
                                <p style={css("margin: 0; font-weight: 600; font-size: 15px")}>🪴 Water the plants</p>
                                {m.e.days ? (
                                  <div
                                    className="pop"
                                    role="group"
                                    aria-label="Days"
                                    style={css("display: flex; flex-wrap: wrap; gap: 5px")}
                                  >
                                    {v.water.days.map((wd: V, wdIndex: number) => (
                                      <Fragment key={wdIndex}>
                                        <button
                                          type="button"
                                          onClick={wd.toggle}
                                          aria-pressed={wd.pressed}
                                          disabled={v.water.saved}
                                          style={css(wd.style)}
                                        >
                                          {wd.label}
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                ) : null}
                                {m.w.days ? <div className="skel" style={css("height: 74px")} /> : null}
                                {m.e.time ? (
                                  <div
                                    className="pop"
                                    role="group"
                                    aria-label="Time"
                                    style={css("display: flex; flex-wrap: wrap; gap: 5px")}
                                  >
                                    {v.water.times.map((wt: V, wtIndex: number) => (
                                      <Fragment key={wtIndex}>
                                        <button
                                          type="button"
                                          onClick={wt.pick}
                                          aria-pressed={wt.pressed}
                                          disabled={v.water.saved}
                                          style={css(wt.style)}
                                        >
                                          {wt.label}
                                        </button>
                                      </Fragment>
                                    ))}
                                  </div>
                                ) : null}
                                {m.w.time ? (
                                  <div className="skel" style={css("height: 34px; width: 75%; border-radius: 999px")} />
                                ) : null}
                                {m.e.summary ? (
                                  <p className="pop" style={css(`margin: 0; font-size: 14px; color: ${v.c.muted}`)}>
                                    {v.water.summary}
                                  </p>
                                ) : null}
                                {m.w.summary ? <div className="skel" style={css("height: 16px; width: 80%")} /> : null}
                                {m.e.save ? (
                                  <button
                                    className="pop"
                                    type="button"
                                    onClick={v.water.save}
                                    disabled={v.water.saveOff}
                                    style={css(v.water.saveStyle)}
                                  >
                                    {v.water.saveLabel}
                                  </button>
                                ) : null}
                                {m.w.save ? (
                                  <div className="skel" style={css("height: 46px; border-radius: 999px")} />
                                ) : null}
                              </div>
                            ) : null}
                            {m.w.root ? <div className="skel" style={css("height: 220px")} /> : null}
                          </>
                        ) : null}
                        {m.isRefund ? (
                          <>
                            {m.e.root ? (
                              <div className="pop" style={css(`${v.c.card}; gap: 10px`)}>
                                <div style={css("display: flex; justify-content: space-between; gap: 8px")}>
                                  <span style={css("font-weight: 600; font-size: 15px")}>
                                    Order #1042 · Jonas Weber
                                  </span>
                                  <span style={css(v.refund.badge)}>{v.refund.status}</span>
                                </div>
                                {m.e.about ? (
                                  <p className="pop" style={css(`margin: 0; font-size: 13.5px; color: ${v.c.muted}`)}>
                                    3 items · paid {v.refund.totalText} on Tuesday
                                  </p>
                                ) : null}
                                {m.w.about ? <div className="skel" style={css("height: 16px; width: 60%")} /> : null}
                                {m.e.reason ? (
                                  <div className="pop" style={css("display: flex; flex-direction: column; gap: 6px")}>
                                    <p style={css("margin: 0; font-size: 13px; font-weight: 600")}>Reason</p>
                                    <div style={css("display: flex; flex-wrap: wrap; gap: 5px")}>
                                      {v.refund.reasons.map((rr: V, rrIndex: number) => (
                                        <Fragment key={rrIndex}>
                                          <button
                                            type="button"
                                            onClick={rr.pick}
                                            aria-pressed={rr.pressed}
                                            disabled={v.refund.doneOn}
                                            style={css(rr.style)}
                                          >
                                            {rr.label}
                                          </button>
                                        </Fragment>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {m.w.reason ? <div className="skel" style={css("height: 56px")} /> : null}
                                {m.e.share ? (
                                  <div className="pop" style={css("display: flex; flex-direction: column; gap: 6px")}>
                                    <p style={css("margin: 0; font-size: 13px; font-weight: 600")}>Amount</p>
                                    <div style={css("display: flex; flex-wrap: wrap; gap: 5px")}>
                                      {v.refund.shares.map((rs: V, rsIndex: number) => (
                                        <Fragment key={rsIndex}>
                                          <button
                                            type="button"
                                            onClick={rs.pick}
                                            aria-pressed={rs.pressed}
                                            disabled={v.refund.doneOn}
                                            style={css(rs.style)}
                                          >
                                            {rs.label}
                                          </button>
                                        </Fragment>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                {m.w.share ? <div className="skel" style={css("height: 56px")} /> : null}
                                {m.e.go ? (
                                  <button
                                    className="pop"
                                    type="button"
                                    onClick={v.refund.go}
                                    disabled={v.refund.goOff}
                                    style={css(v.refund.goStyle)}
                                  >
                                    {v.refund.goLabel}
                                  </button>
                                ) : null}
                                {m.w.go ? (
                                  <div className="skel" style={css("height: 46px; border-radius: 999px")} />
                                ) : null}
                                {v.refund.doneOn ? (
                                  <p className="pop" style={css(v.c.alertOk)}>
                                    {v.refund.doneText}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                            {m.w.root ? <div className="skel" style={css("height: 270px")} /> : null}
                          </>
                        ) : null}
                        {m.done ? (
                          <button
                            type="button"
                            onClick={m.toggleDoc}
                            aria-expanded={m.docOpen}
                            style={css(
                              "align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #E4DACE; color: #5E5873; border-radius: 999px; padding: 4px 12px; font-size: 12.5px; cursor: pointer",
                            )}
                          >
                            <span style={css("font-family: var(--font-mono)")}>{"</>"}</span> {m.docLabel}
                          </button>
                        ) : null}
                        {m.docOpen ? (
                          <div
                            data-doc={m.docId}
                            style={css(
                              "background: #15121F; color: #ECEBF3; border-radius: 14px; padding: 10px 0; max-height: 260px; overflow-y: auto",
                            )}
                          >
                            {m.lines.map((ml: V, mlIndex: number) => (
                              <Fragment key={mlIndex}>
                                <div
                                  style={css(
                                    "padding: 2px 12px; font-family: var(--font-mono); font-size: 10.5px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere",
                                  )}
                                >
                                  {ml.segs.map((sg: V, sgIndex: number) => (
                                    <Fragment key={sgIndex}>
                                      <span
                                        style={css(sg.style)}
                                        className={sg.tip ? "ltipkey" : undefined}
                                        data-tip={sg.tip}
                                      >
                                        {sg.t}
                                      </span>
                                    </Fragment>
                                  ))}
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div
                  style={css(
                    "background: #FFFFFF; border-top: 1px solid #EFE7DD; padding: 10px 12px 16px; display: flex; flex-direction: column; gap: 8px",
                  )}
                >
                  {v.hasAsks ? (
                    <div style={css("display: flex; flex-wrap: wrap; gap: 6px")}>
                      {v.asks.map((a: V, aIndex: number) => (
                        <Fragment key={aIndex}>
                          <button type="button" onClick={a.ask} disabled={v.chatBusy} style={css(a.style)}>
                            {a.label}
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  ) : null}
                  {v.noAsks ? (
                    <p style={css("margin: 0; font-size: 13px; color: #5E5873")}>That was every sample question.</p>
                  ) : null}
                  <p style={css("margin: 0; font-size: 12px; color: #8A839C")}>
                    Sample questions only: no model is attached to this page.{" "}
                    <a href="https://warehouse.uicast.dev">Ask your own in the live demo</a>.
                  </p>
                </div>
                {v.confirmOn ? (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={v.confirm.title}
                    style={css(
                      "position: absolute; inset: 0; background: rgba(29,23,48,.45); display: flex; align-items: center; justify-content: center; padding: 18px",
                    )}
                  >
                    <div
                      className="pop"
                      style={css(
                        "background: #FFFFFF; border-radius: 22px; padding: 20px; display: flex; flex-direction: column; gap: 10px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,.25)",
                      )}
                    >
                      <p style={css("margin: 0; font-weight: 700; font-size: 17px")}>{v.confirm.title}</p>
                      <p style={css("margin: 0; font-size: 14.5px; color: #5E5873")}>{v.confirm.text}</p>
                      <div style={css("display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap")}>
                        <button type="button" onClick={v.confirmNo} style={css(v.c.btnGhost)}>
                          Cancel
                        </button>{" "}
                        <button type="button" onClick={v.confirmYes} style={css(v.c.btnDanger)}>
                          {v.confirm.ok}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>{" "}
      <div
        id="product"
        style={css(
          "padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px))",
        )}
      >
        <section
          style={css(
            "max-width: 1240px; margin: 0 auto; padding-block: 88px 80px; display: flex; flex-direction: column; gap: 40px",
          )}
        >
          <div style={css("display: flex; flex-direction: column; gap: 14px; max-width: 46em")}>
            <p
              style={css(
                "margin: 0; font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--l-accent-text)",
              )}
            >
              For product teams
            </p>
            <h2
              style={css(
                "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(30px, 3.6vw, 48px); line-height: 1.08; letter-spacing: -0.025em; text-wrap: balance",
              )}
            >
              The screen your users want, without the ticket
            </h2>
            <p style={css("margin: 0; font-size: 18px; line-height: 1.6; color: var(--l-text)")}>
              A report for one customer, a form for one process, a view nobody planned: today each is a ticket, a sprint
              and a release. With <strong>uicast</strong> it is a request, answered from parts your team already built.
            </p>
          </div>
          <div style={css("display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px")}>
            {v.teams.map((tm: V, tmIndex: number) => (
              <Fragment key={tmIndex}>
                <div
                  style={css(
                    "background: var(--l-card); border: 1px solid var(--l-line); border-radius: 22px; padding: 24px; display: flex; flex-direction: column; gap: 10px",
                  )}
                >
                  <span aria-hidden="true" style={css(tm.iconStyle)}>
                    {tm.icon}
                  </span>{" "}
                  <h3 style={css("margin: 0; font-size: 19px; font-weight: 600; line-height: 1.3")}>{tm.title}</h3>
                  <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: var(--l-muted)")}>{tm.body}</p>
                </div>
              </Fragment>
            ))}
          </div>
          <div style={css("display: flex; flex-wrap: wrap; gap: 16px")}>
            <div
              style={css(
                "flex: 1 1 420px; min-width: 0; background: var(--l-dark-card); color: #F3F0FF; border-radius: 22px; padding: 28px; display: flex; flex-direction: column; gap: 14px",
              )}
            >
              <h3
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 21px; line-height: 1.25",
                )}
              >
                Questions you'll be asked
              </h3>
              {v.faq.map((q: V, qIndex: number) => (
                <Fragment key={qIndex}>
                  <div style={css("border-top: 1px solid #3A3255; padding-top: 12px")}>
                    <button
                      type="button"
                      onClick={q.toggle}
                      aria-expanded={q.open}
                      style={css(
                        "width: 100%; display: flex; justify-content: space-between; gap: 12px; background: transparent; border: 0; color: #FFFFFF; text-align: left; font-size: 16px; font-weight: 600; cursor: pointer; padding: 4px 0",
                      )}
                    >
                      {q.q}
                      <span aria-hidden="true" style={css("color: #A795FF")}>
                        {q.sign}
                      </span>
                    </button>{" "}
                    {q.open ? (
                      <p
                        className="pop"
                        style={css("margin: 6px 0 0; font-size: 15px; line-height: 1.6; color: #C9C3E0")}
                      >
                        {q.a}
                      </p>
                    ) : null}
                  </div>
                </Fragment>
              ))}
            </div>
            <div
              style={css(
                "flex: 1 1 340px; align-self: flex-start; min-width: 0; background: var(--l-card); border: 1px solid var(--l-line); border-radius: 22px; padding: 28px; display: flex; flex-direction: column; gap: 12px",
              )}
            >
              <h3
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 21px; line-height: 1.25",
                )}
              >
                What it is not
              </h3>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.6; color: var(--l-muted)")}>
                Not a website builder and not a code generator. A generated screen can only combine the components and
                functions your developers registered, so it is as good as those parts.
              </p>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.6; color: var(--l-muted)")}>
                Screens that need pixel-level control, like a marketing page or a print-exact invoice, are still better
                built by hand.
              </p>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.6; color: var(--l-muted)")}>
                It is in beta, open source under the MIT License.
              </p>
            </div>
          </div>
        </section>
      </div>{" "}
      <div
        id="developers"
        style={css(
          "padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); background: var(--l-deep); color: #ECEBF3",
        )}
      >
        <section
          style={css(
            "max-width: 1240px; margin: 0 auto; padding-block: 96px; display: flex; flex-direction: column; gap: 72px",
          )}
        >
          <div style={css("display: flex; flex-direction: column; gap: 32px")}>
            <div style={css("display: flex; flex-direction: column; gap: 14px; max-width: 46em")}>
              <p
                style={css(
                  "margin: 0; font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #C6FF3D",
                )}
              >
                For developers
              </p>
              <h2
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(30px, 3.6vw, 48px); line-height: 1.08; letter-spacing: -0.025em; text-wrap: balance",
                )}
              >
                The model as your front-end developer
              </h2>
              <p style={css("margin: 0; font-size: 18px; line-height: 1.6; color: #C3C0D4")}>
                <strong style={css("color: #ECEBF3")}>
                  uicast is a UI framework whose language is written by models, not people.
                </strong>{" "}
                It gives a model what JSX gives a developer (components, state, events) but is built to be reliable to
                generate rather than easy to maintain. The model's output is data: the engine turns it into a working
                front-end app, with no build or deploy step per page.
              </p>
            </div>
            <div
              style={css(
                "display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 28px",
              )}
            >
              {v.devSteps.map((step: V, stepIndex: number) => (
                <Fragment key={stepIndex}>
                  <div
                    style={css(
                      "min-width: 0; display: flex; flex-direction: column; gap: 10px; border-top: 2px solid #C6FF3D; padding-top: 16px",
                    )}
                  >
                    <p style={css("margin: 0; font-family: var(--font-mono); font-size: 13px; color: #C6FF3D")}>
                      {step.n}
                    </p>
                    <h3 style={css("margin: 0; font-size: 19px; font-weight: 600; line-height: 1.3")}>{step.title}</h3>
                    <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: #A9A5BD")}>{step.body}</p>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("display: flex; flex-direction: column; gap: 18px")}>
            <h2
              style={css(
                "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(26px, 2.8vw, 38px); line-height: 1.1; letter-spacing: -0.02em; text-wrap: balance",
              )}
            >
              Expressions hold the logic
            </h2>
            <p style={css("margin: 0; font-size: 17px; line-height: 1.6; max-width: 46em; color: #C3C0D4")}>
              What makes <strong style={css("color: #ECEBF3")}>uicast</strong> different is{" "}
              <strong style={css("color: #ECEBF3")}>expressions</strong>: computed values, visibility and event handling
              are JavaScript, run by a{" "}
              <a href="/expr" style={css("color: #C6FF3D")}>
                closed-grammar interpreter
              </a>
              . Structured generation offers a fixed set of bindings and operators instead, so a calculation outside
              that set needs a code change.
            </p>
            <div style={css("overflow-x: auto; border: 1px solid #2E2843; border-radius: 16px")}>
              <table style={css("width: 100%; min-width: 620px; border-collapse: collapse; font-size: 15.5px")}>
                <thead>
                  <tr
                    style={css(
                      "text-align: left; color: #A9A5BD; font-size: 12.5px; font-family: var(--font-mono); letter-spacing: 0.04em; text-transform: uppercase",
                    )}
                  >
                    <th scope="col" style={css("padding: 16px 20px; font-weight: 500")}>
                      Approach
                    </th>
                    <th scope="col" style={css("padding: 16px 20px; font-weight: 500")}>
                      Predictability
                    </th>
                    <th scope="col" style={css("padding: 16px 20px; font-weight: 500")}>
                      Expressiveness
                    </th>
                    <th scope="col" style={css("padding: 16px 20px; font-weight: 500")}>
                      Model code
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={css("border-top: 1px solid #2E2843")}>
                    <th scope="row" style={css("padding: 16px 20px; text-align: left; font-weight: 500")}>
                      Raw code generation
                    </th>
                    <td style={css("padding: 16px 20px")}>low</td>
                    <td style={css("padding: 16px 20px")}>unlimited</td>
                    <td style={css("padding: 16px 20px")}>any</td>
                  </tr>
                  <tr style={css("border-top: 1px solid #2E2843; background: #262038")}>
                    <th
                      scope="row"
                      style={css("padding: 16px 20px; text-align: left; font-weight: 700; color: #C6FF3D")}
                    >
                      uicast
                    </th>
                    <td style={css("padding: 16px 20px; font-weight: 600")}>high</td>
                    <td style={css("padding: 16px 20px; font-weight: 600")}>high</td>
                    <td style={css("padding: 16px 20px; font-weight: 600")}>expressions</td>
                  </tr>
                  <tr style={css("border-top: 1px solid #2E2843")}>
                    <th scope="row" style={css("padding: 16px 20px; text-align: left; font-weight: 500")}>
                      Structured generation (
                      <a href="https://github.com/vercel-labs/json-render" style={css("color: #A795FF")}>
                        json-render
                      </a>
                      ,{" "}
                      <a href="https://a2ui.org" style={css("color: #A795FF")}>
                        A2UI
                      </a>
                      )
                    </th>
                    <td style={css("padding: 16px 20px")}>deterministic</td>
                    <td style={css("padding: 16px 20px")}>limited</td>
                    <td style={css("padding: 16px 20px")}>none</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={css("display: flex; flex-wrap: wrap; gap: 40px 56px; align-items: center")}>
            <div style={css("flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 16px")}>
              <h2
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(26px, 2.8vw, 38px); line-height: 1.1; letter-spacing: -0.02em; text-wrap: balance",
                )}
              >
                The expression evaluator
              </h2>
              <p style={css("margin: 0; font-size: 17px; line-height: 1.6; color: #C3C0D4")}>
                Expressions run on an interpreter for a{" "}
                <strong style={css("color: #ECEBF3")}>fraction of JavaScript</strong>: a closed grammar, an allow-list
                of methods and globals, a check on every property read, and a CPU and allocation budget. By default
                nothing reaches <code style={css("font-family: var(--font-mono); font-size: 0.9em")}>eval</code> or{" "}
                <code style={css("font-family: var(--font-mono); font-size: 0.9em")}>new Function</code>, so a{" "}
                <strong style={css("color: #ECEBF3")}>uicast</strong> app runs under a strict Content-Security-Policy,
                without <code style={css("font-family: var(--font-mono); font-size: 0.9em")}>unsafe-eval</code>.
              </p>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: #A9A5BD")}>
                The interpreter secures the language, not what you plug into it: host functions are capabilities you
                grant, and scope data is only as safe as what you put there.
              </p>{" "}
              <a href="/expr" style={css("font-weight: 600; color: #C6FF3D")}>
                The expression language
              </a>
            </div>
            <div
              style={css(
                "flex: 1 1 440px; min-width: 0; background: #1E1A2C; border: 1px solid #2E2843; border-radius: 18px; padding: 22px; display: flex; flex-direction: column; gap: 12px",
              )}
            >
              <p style={css("margin: 0; font-family: var(--font-mono); font-size: 13px; color: #8E87A8")}>
                {"// scopes.root.orders === [{ total: 2 }, { total: 3 }]"}
              </p>
              {v.exprs.map((ex: V, exIndex: number) => (
                <Fragment key={exIndex}>
                  <div style={css(ex.style)}>
                    <code
                      style={css(
                        "font-family: var(--font-mono); font-size: 13.5px; overflow-wrap: anywhere; color: #ECEBF3",
                      )}
                    >
                      {ex.code}
                    </code>{" "}
                    <span style={css("display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px")}>
                      <span style={css(ex.badge)}>{ex.result}</span>
                      <span style={css(`font-size: 13.5px; color: ${ex.whyColor}`)}>{ex.why}</span>
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div style={css("display: flex; flex-wrap: wrap; gap: 40px 56px; align-items: flex-start")}>
            <div style={css("flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 16px")}>
              <h2
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(26px, 2.8vw, 38px); line-height: 1.1; letter-spacing: -0.02em; text-wrap: balance",
                )}
              >
                The prompt is generated from your code
              </h2>
              <p style={css("margin: 0; font-size: 17px; line-height: 1.6; color: #C3C0D4")}>
                <strong style={css("color: #ECEBF3")}>uicast</strong> prints the model's list of components and
                functions from your component definitions and function schemas. Change a prop or a function, and the
                prompt changes with it.
              </p>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: #A9A5BD")}>
                Both lists are closed: the model picks components from your{" "}
                <strong style={css("color: #ECEBF3")}>catalog</strong> and calls only your{" "}
                <strong style={css("color: #ECEBF3")}>functions</strong>, each a{" "}
                <a href="https://standard-tool.js.org/" style={css("color: #A795FF")}>
                  standard-tool
                </a>
                . The descriptions are the ones you wrote on props and schema fields.
              </p>{" "}
              <a href="/prompt" style={css("font-weight: 600; color: #C6FF3D")}>
                Assembling the prompt
              </a>
            </div>
            <pre
              style={css(
                "flex: 1 1 440px; min-width: 0; margin: 0; background: #1E1A2C; border: 1px solid #2E2843; color: #DAD8EA; border-radius: 18px; padding: 20px; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.6; white-space: pre; overflow-x: auto",
              )}
            >
              <PromptMarkdown
                text={
                  '# Available Components\n\nAlert, Badge, BarChart, Button, Card, Checkbox, …\n\n## Component Details\n\n- Button — A clickable button.\n  Props:\n    - text?: string — The button label\n    - variant?: "default" | "destructive" | "outline" | …\n  Event handlers:\n    - onClick(evt: MouseEvent)\n\n# Available Functions\n\nlistOrders, refundOrder, …\n\n## Function Details\n\n- listOrders() => {\n    id: number /* integer */;\n    customer: string;\n    total: number;\n    status: "pending" | "paid" | "shipped" | "refunded";\n  }[]: Every order this week, newest first.'
                }
              />
            </pre>
          </div>
          <div
            style={css(
              "display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 18px",
            )}
          >
            {v.devMore.map((f: V, fIndex: number) => (
              <Fragment key={fIndex}>
                <div
                  style={css(
                    "min-width: 0; background: #1E1A2C; border: 1px solid #2E2843; border-radius: 18px; padding: 24px; display: flex; flex-direction: column; gap: 10px",
                  )}
                >
                  <h3 style={css("margin: 0; font-size: 19px; font-weight: 600; line-height: 1.3")}>{f.title}</h3>
                  <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: #A9A5BD")}>{f.body}</p>{" "}
                  <a href={f.href} style={css("margin-top: auto; font-size: 14.5px; font-weight: 600; color: #C6FF3D")}>
                    {f.link}
                  </a>
                </div>
              </Fragment>
            ))}
          </div>
          <div style={css("display: flex; flex-direction: column; gap: 16px")}>
            <h2
              style={css(
                "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(26px, 2.8vw, 38px); line-height: 1.1; letter-spacing: -0.02em",
              )}
            >
              Next steps
            </h2>
            <ul
              style={css(
                "margin: 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: 8px; font-size: 16.5px; color: #C3C0D4",
              )}
            >
              {v.nextSteps.map((ns: V, nsIndex: number) => (
                <Fragment key={nsIndex}>
                  <li>
                    <a href={ns.href} style={css("color: #C6FF3D; font-weight: 600")}>
                      {ns.title}
                    </a>{" "}
                    — {ns.body}
                  </li>
                </Fragment>
              ))}
            </ul>
          </div>
        </section>
      </div>{" "}
      <div
        style={css(
          "padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px))",
        )}
      >
        <section
          style={css(
            "max-width: 1240px; margin: 0 auto; padding-block: 88px 96px; display: flex; flex-direction: column; gap: 32px",
          )}
        >
          <h2
            style={css(
              "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(30px, 3.6vw, 48px); line-height: 1.08; letter-spacing: -0.025em; text-wrap: balance",
            )}
          >
            Try it
          </h2>
          <div style={css("display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px")}>
            <div
              style={css(
                "min-width: 0; background: #6E56CF; color: #FFFFFF; border-radius: 24px; padding: 26px; display: flex; flex-direction: column; gap: 14px",
              )}
            >
              <p
                style={css(
                  "margin: 0; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #E4DEFF",
                )}
              >
                Live demo · no setup
              </p>
              <h3
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 22px; line-height: 1.2",
                )}
              >
                Warehouse back office
              </h3>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: #F1EEFF")}>
                A back office for a made-up store: suppliers, products, customers, orders and a stock ledger. Only the
                sidebar and the chat panel are hand-written; every page and chat answer is a document a model wrote.
                Browse without an account, or log in with OpenRouter to generate on your own key.
              </p>{" "}
              <a
                href="https://warehouse.uicast.dev"
                style={css(
                  "margin-top: auto; display: inline-flex; align-self: flex-start; align-items: center; gap: 8px; background: #FFFFFF; color: #3F2D8F; text-decoration: none; font-weight: 600; border-radius: 999px; padding: 12px 20px",
                )}
              >
                warehouse.uicast.dev{" "}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </a>
            </div>
            <div
              style={css(
                "min-width: 0; background: var(--l-card); border: 1px solid var(--l-line); border-radius: 24px; padding: 26px; display: flex; flex-direction: column; gap: 14px",
              )}
            >
              <p
                style={css(
                  "margin: 0; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--l-accent-text)",
                )}
              >
                Agent skill
              </p>
              <h3
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 22px; line-height: 1.2",
                )}
              >
                Let your agent wire it
              </h3>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: var(--l-muted)")}>
                One SKILL.md covers components, functions, the prompt, the renderer, chat and errors. The skills CLI
                installs it for Claude Code, Cursor, Codex, Gemini CLI, Copilot and other agents.
              </p>
              <label htmlFor="try-skill" style={css("margin-top: auto; font-size: 13px; color: var(--l-muted)")}>
                Run in your project
              </label>
              <div
                style={css(
                  "display: flex; align-items: stretch; background: var(--l-bg); border: 1px solid var(--l-line); border-radius: 14px; overflow: hidden",
                )}
              >
                <input
                  id="try-skill"
                  readOnly
                  value="npx skills add finom/uicast"
                  style={css(
                    "flex: 1 1 auto; min-width: 0; border: 0; background: transparent; padding: 12px 14px; font-family: var(--font-mono); font-size: 14px; color: var(--l-ink)",
                  )}
                />{" "}
                <button
                  type="button"
                  onClick={v.copyTrySkill}
                  style={css(
                    "flex: 0 0 auto; border: 0; border-left: 1px solid var(--l-line); background: var(--l-tint); color: var(--l-tint-ink); font-weight: 600; font-size: 14px; padding: 0 16px; min-height: 46px; cursor: pointer",
                  )}
                >
                  {v.trySkillLabel}
                </button>
              </div>
            </div>
            <div
              style={css(
                "min-width: 0; background: var(--l-card); border: 1px solid var(--l-line); border-radius: 24px; padding: 26px; display: flex; flex-direction: column; gap: 14px",
              )}
            >
              <p
                style={css(
                  "margin: 0; font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--l-accent-text)",
                )}
              >
                Starter app
              </p>
              <h3
                style={css(
                  "margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 22px; line-height: 1.2",
                )}
              >
                Start from a template
              </h3>
              <p style={css("margin: 0; font-size: 15.5px; line-height: 1.55; color: var(--l-muted)")}>
                The app the getting-started guide builds: a prompt box, the shadcn catalog, one function and a stand-in
                API. Next.js is the example; any React app with a server route works.
              </p>
              <label htmlFor="try-starter" style={css("margin-top: auto; font-size: 13px; color: var(--l-muted)")}>
                Create the app
              </label>
              <div
                style={css(
                  "display: flex; align-items: stretch; background: var(--l-bg); border: 1px solid var(--l-line); border-radius: 14px; overflow: hidden",
                )}
              >
                <input
                  id="try-starter"
                  readOnly
                  value="npx create-next-app@latest my-app --example https://github.com/finom/uicast/tree/main/examples/starter"
                  style={css(
                    "flex: 1 1 auto; min-width: 0; border: 0; background: transparent; padding: 12px 14px; font-family: var(--font-mono); font-size: 14px; color: var(--l-ink)",
                  )}
                />{" "}
                <button
                  type="button"
                  onClick={v.copyStarter}
                  style={css(
                    "flex: 0 0 auto; border: 0; border-left: 1px solid var(--l-line); background: var(--l-tint); color: var(--l-tint-ink); font-weight: 600; font-size: 14px; padding: 0 16px; min-height: 46px; cursor: pointer",
                  )}
                >
                  {v.starterLabel}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>{" "}
      <div
        style={css(
          "padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); border-top: 1px solid var(--l-line)",
        )}
      >
        <footer
          style={css(
            "max-width: 1240px; margin: 0 auto; padding-block: 36px 48px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 20px 40px; font-size: 14.5px; color: var(--l-muted)",
          )}
        >
          <div style={css("display: flex; flex-direction: column; gap: 8px")}>
            <div style={css("display: flex; align-items: center; gap: 10px; color: var(--l-ink)")}>
              <svg width="20" height="20" viewBox="3 3 18 18" aria-hidden="true">
                <g style={css("fill: var(--l-logo-top)")}>
                  <rect x="3" y="3" width="5" height="5" rx="1.25" />
                  <rect x="16" y="3" width="5" height="5" rx="1.25" />
                  <rect x="3" y="9.5" width="5" height="5" rx="1.25" />
                  <rect x="16" y="9.5" width="5" height="5" rx="1.25" />
                </g>
                <g style={css("fill: var(--l-logo-bottom)")}>
                  <rect x="3" y="16" width="5" height="5" rx="1.25" />
                  <rect x="9.5" y="16" width="5" height="5" rx="1.25" />
                  <rect x="16" y="16" width="5" height="5" rx="1.25" />
                </g>
              </svg>{" "}
              <span style={css("font-family: var(--font-display); font-weight: 600")}>uicast</span>
            </div>
            <p style={css("margin: 0")}>The expression-driven generative UI framework. MIT License, in beta.</p>
          </div>
          <div style={css("display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: flex-start")}>
            <a href="/getting-started" style={css("padding-block: 6px")}>
              Getting started
            </a>{" "}
            <a href="/getting-started#with-an-agent" style={css("padding-block: 6px")}>
              Agent skill
            </a>{" "}
            <a href="/security" style={css("padding-block: 6px")}>
              Security
            </a>{" "}
            <a href="https://warehouse.uicast.dev" style={css("padding-block: 6px")}>
              Live demo
            </a>{" "}
            <a href="https://github.com/finom/uicast" style={css("padding-block: 6px")}>
              GitHub
            </a>{" "}
            <a href="https://www.npmjs.com/package/@uicast/core" style={css("padding-block: 6px")}>
              npm
            </a>{" "}
            <a href="https://discord.com/invite/qdT8WEHUuP" style={css("padding-block: 6px")}>
              Discord
            </a>{" "}
            <a href="https://x.com/andrey_gubanov1" style={css("padding-block: 6px")}>
              X
            </a>{" "}
            <a href="https://standard-tool.js.org/" style={css("padding-block: 6px")}>
              standard-tool
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
