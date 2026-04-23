import Head from "next/head";
import { useMemo, useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const rewards = [
  { value: "$25", weight: 22 },
  { value: "$30", weight: 18 },
  { value: "$35", weight: 15 },
  { value: "$40", weight: 12 },
  { value: "$45", weight: 10 },
  { value: "$50", weight: 8 },
  { value: "$55", weight: 6 },
  { value: "$60", weight: 4 },
  { value: "$65", weight: 3 },
  { value: "$70", weight: 2 },
];

const segmentColors = [
  "#4C1D95","#6D28D9","#8B5CF6","#7C3AED","#2E1065",
  "#9333EA","#C084FC","#A855F7","#5B21B6","#7E22CE"
];

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;

  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, start, end) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? "0" : "1";

  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
}

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // 🔥 Get session from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session");
    if (session) setSessionId(session);
  }, []);

  const size = 420;
  const center = size / 2;
  const radius = 185;
  const textRadius = 120;
  const deg = 360 / rewards.length;

  const slices = useMemo(() => {
    return rewards.map((r, i) => {
      const start = i * deg;
      const end = start + deg;
      const mid = start + deg / 2;
      const p = polarToCartesian(center, center, textRadius, mid);

      return {
        ...r,
        mid,
        path: describeArc(center, center, radius, start, end),
        x: p.x,
        y: p.y,
      };
    });
  }, []);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult("");

    const selected = weightedPick(rewards);
    const index = rewards.findIndex(r => r.value === selected.value);

    const target = 360 - (index * deg + deg / 2);
    const final = rotation + 360 * 8 + target;

    setRotation(final);

    setTimeout(async () => {
      setResult(selected.value);
      setSpinning(false);

      // 🔥 SEND RESULT TO BOT
      if (sessionId && API_BASE) {
        try {
          await fetch(`${API_BASE}/complete-spin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionId,
              reward: selected.value
            }),
          });
        } catch (err) {
          console.error("Error sending result:", err);
        }
      }

    }, 4200);
  };

  return (
    <>
      <Head>
        <title>Pitch Health Wheel</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap" rel="stylesheet" />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          fontFamily: "Montserrat",
          backgroundImage: 'url("/web background.png")',
          backgroundRepeat: "repeat",
          backgroundSize: "500px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>

          <h1 style={{
            fontSize: "48px",
            fontWeight: "900",
            color: "#6e42ae",
            whiteSpace: "nowrap"
          }}>
            🎉 PITCH HEALTH WHEEL 🎉
          </h1>

          {/* POINTER */}
          <div style={{
            borderLeft: "20px solid transparent",
            borderRight: "20px solid transparent",
            borderTop: "40px solid white",
            margin: "0 auto 10px"
          }} />

          {/* WHEEL */}
          <div style={{
            width: "420px",
            height: "420px",
            margin: "auto",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 4s ease-out"
          }}>
            <svg viewBox={`0 0 ${size} ${size}`}>
              {slices.map((s, i) => (
                <g key={i}>
                  <path d={s.path} fill={segmentColors[i]} stroke="white" strokeWidth="2" />
                  <text
                    x={s.x}
                    y={s.y}
                    fill="white"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(${s.mid}, ${s.x}, ${s.y})`}
                  >
                    {s.value}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <button onClick={spin} disabled={spinning}
            style={{
              marginTop: "20px",
              padding: "15px 30px",
              fontSize: "20px",
              borderRadius: "12px",
              background: "#6e42ae",
              color: "white",
              border: "none"
            }}>
            🎡 SPIN
          </button>

          {result && (
            <h2 style={{ marginTop: "20px", color: "#6e42ae" }}>
              🎉 You won {result}
            </h2>
          )}

        </div>
      </div>
    </>
  );
}
