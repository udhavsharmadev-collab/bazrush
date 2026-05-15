"use client";

import { useState, useRef } from "react";

const VALID_EMAIL    = "udhavsharmadev@gmail.com";
const VALID_PASSWORD = "bazrush@123";
const VALID_PATTERN  = [1, 5, 9, 6, 3];
const VALID_PIN      = "2010";

// ─── Shared primitives ────────────────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div className="flex justify-center gap-2 mb-7">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            height: 3,
            width: i === current ? 36 : 28,
            borderRadius: 2,
            background: i < current
              ? "rgba(255,255,255,0.5)"
              : i === current
              ? "white"
              : "rgba(255,255,255,0.2)",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function StepHeader({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
        border: "1.5px solid rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 12px", fontSize: 26,
      }}>
        {icon}
      </div>
      <div style={{ color: "white", fontSize: 17, fontWeight: 900 }}>{title}</div>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function WarningBox({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 12, padding: "10px 12px",
      marginBottom: 18, fontSize: 11,
      color: "rgba(255,180,180,0.9)", lineHeight: 1.6,
    }}>
      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>⚠️</span>
      <span>{children}</span>
    </div>
  );
}

function AttemptDots({ used, max = 3 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "8px 0" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: i < used ? "#f87171" : "rgba(255,255,255,0.2)",
          display: "inline-block", transition: "background 0.2s",
        }} />
      ))}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.6px", color: "rgba(255,255,255,0.5)", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function AuthInput({ type, placeholder, value, onChange, onKeyDown }) {
  return (
    <input
      type={type}
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10,
        padding: "10px 14px",
        color: "white",
        fontSize: 14,
        outline: "none",
        marginBottom: 14,
        boxSizing: "border-box",
      }}
      onFocus={e => (e.target.style.borderColor = "rgba(255,255,255,0.45)")}
      onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
    />
  );
}

function PrimaryBtn({ onClick, children, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "12px 0",
        background: "white", color: "#5b21b6",
        border: "none", borderRadius: 12,
        fontSize: 14, fontWeight: 900,
        cursor: "pointer", marginTop: 8,
        transition: "opacity 0.15s, transform 0.1s",
        ...style,
      }}
      onMouseEnter={e => (e.target.style.opacity = "0.9")}
      onMouseLeave={e => (e.target.style.opacity = "1")}
      onMouseDown={e  => (e.target.style.transform = "scale(0.98)")}
      onMouseUp={e    => (e.target.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10, color: "rgba(255,255,255,0.75)",
        fontSize: 13, fontWeight: 600,
        cursor: "pointer", transition: "background 0.15s",
        ...style,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
    >
      {children}
    </button>
  );
}

// ─── Step 1 — Credentials ─────────────────────────────────────────────────────

function CredentialsStep({ onSuccess, onLockout }) {
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [attempts, setAttempts] = useState(0);
  const cardRef                 = useRef(null);

  function shake() {
    const el = cardRef.current;
    if (!el) return;
    el.style.animation = "authShake 0.4s ease";
    setTimeout(() => (el.style.animation = ""), 400);
  }

  function verify() {
    if (email.trim() === VALID_EMAIL && pass === VALID_PASSWORD) {
      onSuccess();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      shake();
      if (next >= 3) onLockout("Too many failed attempts. Access has been locked.");
    }
  }

  return (
    <div ref={cardRef}>
      <StepHeader icon="🔐" title="Identity Verification" sub="Step 1 of 4 — Credentials" />
      <WarningBox>Unauthorized access attempts are logged, traced, and reported. System monitored 24/7.</WarningBox>
      <FieldLabel>Owner Email</FieldLabel>
      <AuthInput type="email" placeholder="owner@classy.com" value={email}
        onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && verify()} />
      <FieldLabel>Password</FieldLabel>
      <AuthInput type="password" placeholder="••••••••••" value={pass}
        onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && verify()} />
      <AttemptDots used={attempts} />
      <PrimaryBtn onClick={verify}>Verify Identity →</PrimaryBtn>
    </div>
  );
}

// ─── Step 2 — Pattern ─────────────────────────────────────────────────────────

function PatternStep({ onSuccess, onLockout }) {
  const [seq, setSeq]           = useState([]);
  const [attempts, setAttempts] = useState(0);
  const svgRef                  = useRef(null);
  const gridRef                 = useRef(null);
  const nodeRefs                = useRef({});
  const wrapRef                 = useRef(null);

  function shake() {
    const el = wrapRef.current;
    if (!el) return;
    el.style.animation = "authShake 0.4s ease";
    setTimeout(() => (el.style.animation = ""), 400);
  }

  function getCenter(n) {
    const el = nodeRefs.current[n], grid = gridRef.current;
    if (!el || !grid) return { x: 0, y: 0 };
    const er = el.getBoundingClientRect(), gr = grid.getBoundingClientRect();
    return { x: er.left - gr.left + er.width / 2, y: er.top - gr.top + er.height / 2 };
  }

  function drawLines(s) {
    if (!svgRef.current) return;
    if (s.length < 2) { svgRef.current.innerHTML = ""; return; }
    svgRef.current.innerHTML = s.slice(0, -1).map((n, i) => {
      const a = getCenter(n), b = getCenter(s[i + 1]);
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" stroke-linecap="round"/>`;
    }).join("");
  }

  function tap(n) {
    if (seq.includes(n)) return;
    const next = [...seq, n];
    setSeq(next);
    drawLines(next);
  }

  function clear() {
    setSeq([]);
    if (svgRef.current) svgRef.current.innerHTML = "";
  }

  function confirm() {
    const ok = seq.length === VALID_PATTERN.length && seq.every((v, i) => v === VALID_PATTERN[i]);
    if (ok) {
      onSuccess();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      shake();
      setTimeout(clear, 450);
      if (next >= 3) onLockout("Pattern mismatch. Security alert triggered.");
    }
  }

  return (
    <div ref={wrapRef}>
      <StepHeader icon="⬡" title="Security Pattern" sub="Step 2 of 4 — Draw your secret pattern" />
      <WarningBox>Pattern mismatches trigger alerts. Your IP and device fingerprint are being recorded.</WarningBox>

      <div ref={gridRef} style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14, padding: 16,
        background: "rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, margin: "14px 0", position: "relative",
      }}>
        <svg ref={svgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />
        {[1,2,3,4,5,6,7,8,9].map(n => {
          const idx = seq.indexOf(n), sel = idx !== -1;
          return (
            <div
              key={n}
              ref={el => (nodeRefs.current[n] = el)}
              onClick={() => tap(n)}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                border: `2px solid ${sel ? "white" : "rgba(255,255,255,0.2)"}`,
                background: sel ? "white" : "rgba(255,255,255,0.1)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "auto", position: "relative", zIndex: 2,
                transition: "all 0.12s", userSelect: "none",
              }}
            >
              {sel && <span style={{ color: "#5b21b6", fontWeight: 900, fontSize: 13 }}>{idx + 1}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
        Pattern: <span style={{ color: "white", fontWeight: 700 }}>
          {seq.length ? seq.map(() => "●").join(" ") : "_ _ _ _ _"}
        </span>
      </div>
      <AttemptDots used={attempts} />
      <GhostBtn onClick={clear} style={{ width: "100%", marginTop: 10 }}>↺ Clear</GhostBtn>
      <PrimaryBtn onClick={confirm}>Confirm Pattern →</PrimaryBtn>
    </div>
  );
}

// ─── Step 3 — Biometric ───────────────────────────────────────────────────────

function BiometricStep({ onSuccess }) {
  const [state, setState]   = useState("idle");
  const [mode, setMode]     = useState("finger");
  const [mainTxt, setMain]  = useState("Select scan method below");
  const [subTxt, setSub]    = useState("");
  const timerRef            = useRef(null);
  const intervalRef         = useRef(null);

  function doScan(type) {
    if (state === "scanning") return;
    setMode(type);
    setState("scanning");
    setMain("Scanning… do not move");
    setSub("Initializing sensor array");

    const msgs = [
      "Reading biometric signature",
      "Mapping unique identifiers",
      "Cross-referencing database",
      "Verifying liveness detection",
      "Confirming identity match",
    ];
    let i = 0;
    intervalRef.current = setInterval(() => { setSub(msgs[i++ % msgs.length]); }, 520);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setState("done");
      setMain(type === "finger" ? "Fingerprint matched" : "Face matched");
      setSub("✓ Identity confirmed");
      setTimeout(onSuccess, 1000);
    }, type === "finger" ? 2800 : 3200);
  }

  const ringBorder =
    state === "scanning" ? "2px solid rgba(255,255,255,0.7)"
    : state === "done"   ? "2px solid #4ade80"
    : "2px solid rgba(255,255,255,0.15)";

  const iconColor =
    state === "done"       ? "#4ade80"
    : state === "scanning" ? "rgba(255,255,255,0.9)"
    : "rgba(255,255,255,0.3)";

  return (
    <div>
      <StepHeader icon="👁" title="Biometric Scan" sub="Step 3 of 4 — Live identity scan" />
      <WarningBox>Biometric spoofing is a criminal offense. Cross-referenced with national identity databases.</WarningBox>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 18px" }}>
        <div style={{
          width: 130, height: 130, borderRadius: "50%",
          border: ringBorder,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", marginBottom: 16,
          transition: "border 0.3s",
          animation: state === "scanning" ? "pulseRing 1.1s ease-in-out infinite" : "none",
        }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", position: "relative",
          }}>
            {state === "scanning" && (
              <div style={{
                position: "absolute", left: 8, right: 8, height: 2,
                background: "rgba(255,255,255,0.8)", borderRadius: 1,
                animation: "scanBar 1.4s linear infinite",
              }} />
            )}
            <span style={{ fontSize: 38, color: iconColor, transition: "color 0.3s", zIndex: 1 }}>
              {mode === "finger" ? "🫆" : "👤"}
            </span>
          </div>
          {state === "scanning" && (
            <>
              <div style={{
                position: "absolute", inset: -8, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.12)",
                animation: "expandRing 1.5s ease-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: -8, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.07)",
                animation: "expandRing 1.5s ease-out 0.75s infinite",
              }} />
            </>
          )}
        </div>

        <div style={{
          fontSize: 13, fontWeight: 700, marginBottom: 4,
          color: state === "done" ? "#4ade80" : "white",
          transition: "color 0.3s",
        }}>
          {mainTxt}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", minHeight: 16 }}>{subTxt}</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <GhostBtn onClick={() => doScan("finger")} style={{ flex: 1 }}>🫆 Fingerprint</GhostBtn>
        <GhostBtn onClick={() => doScan("face")}   style={{ flex: 1 }}>👤 Face ID</GhostBtn>
      </div>
    </div>
  );
}

// ─── Step 4 — PIN ─────────────────────────────────────────────────────────────

function PinStep({ onSuccess, onLockout }) {
  const [pin, setPin]           = useState("");
  const [dotState, setDotState] = useState("idle");
  const [attempts, setAttempts] = useState(0);
  const wrapRef                 = useRef(null);

  function shake() {
    const el = wrapRef.current;
    if (!el) return;
    el.style.animation = "authShake 0.4s ease";
    setTimeout(() => (el.style.animation = ""), 400);
  }

  function press(n) {
    if (pin.length >= 4 || dotState !== "idle") return;
    const next = pin + n;
    setPin(next);
    if (next.length === 4) setTimeout(() => check(next), 180);
  }

  function del() {
    if (dotState !== "idle") return;
    setPin(p => p.slice(0, -1));
  }

  function check(entered) {
    if (entered === VALID_PIN) {
      setDotState("ok");
      setTimeout(onSuccess, 700);
    } else {
      setDotState("err");
      shake();
      const next = attempts + 1;
      setAttempts(next);
      setTimeout(() => {
        setPin("");
        setDotState("idle");
        if (next >= 3) onLockout("PIN lockout. All access attempts exhausted.");
      }, 650);
    }
  }

  function dotBg(i) {
    if (i >= pin.length) return "transparent";
    if (dotState === "ok")  return "#4ade80";
    if (dotState === "err") return "#f87171";
    return "white";
  }
  function dotBorder(i) {
    if (i >= pin.length) return "2px solid rgba(255,255,255,0.3)";
    if (dotState === "ok")  return "2px solid #4ade80";
    if (dotState === "err") return "2px solid #f87171";
    return "2px solid white";
  }

  return (
    <div ref={wrapRef}>
      <StepHeader icon="🔒" title="PIN Verification" sub="Step 4 of 4 — Enter your 4-digit PIN" />
      <WarningBox>PIN brute-force is detected and flagged. 3 attempts maximum.</WarningBox>

      <div style={{ display: "flex", justifyContent: "center", gap: 18, margin: "20px 0" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 20, height: 20, borderRadius: "50%",
            background: dotBg(i),
            border: dotBorder(i),
            transition: "all 0.15s",
            animation: dotState === "err" && i < pin.length ? "authShake 0.3s ease" : "none",
          }} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => press(String(n))} style={{
            padding: "15px 0",
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 12, color: "white",
            fontSize: 18, fontWeight: 700, cursor: "pointer",
            transition: "all 0.1s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
          onMouseDown={e  => (e.currentTarget.style.transform = "scale(0.93)")}
          onMouseUp={e    => (e.currentTarget.style.transform = "scale(1)")}>
            {n}
          </button>
        ))}
        <div />
        <button onClick={() => press("0")} style={{
          padding: "15px 0",
          background: "rgba(255,255,255,0.09)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 12, color: "white",
          fontSize: 18, fontWeight: 700, cursor: "pointer",
          transition: "all 0.1s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
        onMouseDown={e  => (e.currentTarget.style.transform = "scale(0.93)")}
        onMouseUp={e    => (e.currentTarget.style.transform = "scale(1)")}>
          0
        </button>
        <button onClick={del} style={{
          padding: "15px 0",
          background: "rgba(255,255,255,0.09)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 12, color: "rgba(255,255,255,0.6)",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.1s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
        onMouseDown={e  => (e.currentTarget.style.transform = "scale(0.93)")}
        onMouseUp={e    => (e.currentTarget.style.transform = "scale(1)")}>
          ⌫
        </button>
      </div>
      <AttemptDots used={attempts} />
    </div>
  );
}

// ─── Granted ──────────────────────────────────────────────────────────────────

function GrantedScreen({ onEnter }) {
  const time = new Date().toLocaleTimeString();
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: 50, marginBottom: 12 }}>🔓</div>
      <div style={{ color: "#4ade80", fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Access Granted</div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 20 }}>All 4 security layers cleared</div>
      <div style={{
        background: "rgba(74,222,128,0.08)",
        border: "1px solid rgba(74,222,128,0.25)",
        borderRadius: 12, padding: 16,
        marginBottom: 20, textAlign: "left",
      }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Session</div>
        {[
          ["Login time",  time,           "white"],
          ["Auth level",  "Maximum — L4", "#4ade80"],
          ["Biometric",   "Verified",     "#4ade80"],
          ["PIN",         "Confirmed",    "#4ade80"],
        ].map(([k, v, c]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
            <span style={{ color: c, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <PrimaryBtn onClick={onEnter}>Enter Owner Panel →</PrimaryBtn>
    </div>
  );
}

// ─── Lockout ──────────────────────────────────────────────────────────────────

function LockoutScreen({ message, onReset }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
      <div style={{ color: "#f87171", fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Access Denied</div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 16 }}>{message}</div>
      <div style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 12, padding: 14,
        fontSize: 11, color: "rgba(255,180,180,0.75)",
        lineHeight: 1.7, marginBottom: 20,
      }}>
        Your IP address, device fingerprint, and access timestamp have been permanently logged.
        Continued unauthorized access may result in legal proceedings.
      </div>
      <GhostBtn onClick={onReset} style={{ width: "100%" }}>↺ Reset & Try Again</GhostBtn>
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export default function ClassyOwnerAuth({ onAuthenticated }) {
  const [step,    setStep]    = useState(0);
  const [lockMsg, setLockMsg] = useState("");

  function lockout(msg) { setLockMsg(msg); setStep(-1); }
  function reset()       { setStep(0); setLockMsg(""); }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e0a3c 0%, #3b0f7a 30%, #5b21b6 65%, #7c3aed 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, color: "white", fontSize: 17,
          }}>C</div>
          <span style={{ fontWeight: 900, color: "white", fontSize: 21, letterSpacing: "-0.3px" }}>Classy</span>
          <span style={{
            fontSize: 9, background: "rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.85)", padding: "3px 8px",
            borderRadius: 20, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "1px",
          }}>Owner</span>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 22, padding: 28,
        }}>
          {step >= 0 && step < 4 && <StepDots current={step} />}

          {step === -1 && <LockoutScreen message={lockMsg} onReset={reset} />}
          {step === 0  && <CredentialsStep onSuccess={() => setStep(1)} onLockout={lockout} />}
          {step === 1  && <PatternStep    onSuccess={() => setStep(2)} onLockout={lockout} />}
          {step === 2  && <BiometricStep  onSuccess={() => setStep(3)} />}
          {step === 3  && <PinStep        onSuccess={() => setStep(4)} onLockout={lockout} />}
          {step === 4  && <GrantedScreen  onEnter={onAuthenticated} />}
        </div>

        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.22)", fontSize: 10, marginTop: 16 }}>
          Secured by 4-factor authentication · Classy {new Date().getFullYear()}
        </div>
      </div>

      <style>{`
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
          50%       { box-shadow: 0 0 0 18px rgba(255,255,255,0); }
        }
        @keyframes expandRing {
          0%   { transform: scale(1);    opacity: 0.35; }
          100% { transform: scale(1.45); opacity: 0;    }
        }
        @keyframes scanBar {
          0%   { top: 8%;  opacity: 1;   }
          100% { top: 90%; opacity: 0.1; }
        }
        @keyframes authShake {
          0%,100% { transform: translateX(0);   }
          20%     { transform: translateX(-9px); }
          40%     { transform: translateX(9px);  }
          60%     { transform: translateX(-6px); }
          80%     { transform: translateX(6px);  }
        }
        input[type="email"]::placeholder,
        input[type="password"]::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}