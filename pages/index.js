import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const cashRewards = [
  { value: "$25", weight: 15 },
  { value: "$30", weight: 13 },
  { value: "$35", weight: 11 },
  { value: "$40", weight: 8 },
  { value: "$45", weight: 7 },
  { value: "$50", weight: 6 },
  { value: "$55", weight: 4 },
  { value: "$60", weight: 3 },
  { value: "$65", weight: 2 },
  { value: "$70", weight: 1 },
];

// Promotional rewards remain eligible through December 7, 2026 (US Eastern Time).
// Their exact value strings are passed unchanged to the bot's Spin Log.
const cupPointRewards = [
  { value: "+1 Cup Point", weight: 15 },
  { value: "+2 Cup Points", weight: 10 },
  { value: "+3 Cup Points", weight: 5 },
];
const CUP_POINTS_END = Date.parse("2026-12-08T05:00:00Z");

function getRewards() {
  return Date.now() < CUP_POINTS_END
    ? [...cashRewards, ...cupPointRewards]
    : cashRewards;
}

const segmentColors = [
  "#4C1D95",
  "#6D28D9",
  "#8B5CF6",
  "#7C3AED",
  "#2E1065",
  "#9333EA",
  "#C084FC",
  "#A855F7",
  "#5B21B6",
  "#7E22CE",
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

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function describeArcSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [alreadyUsed, setAlreadyUsed] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const wheelSize = 430;
  const center = wheelSize / 2;
  const radius = 192;
  const textRadius = 137;
  const [rewards, setRewards] = useState(cashRewards);
  const degreesPerSlice = 360 / rewards.length;

  useEffect(() => {
    setRewards(getRewards());
  }, []);

  const slices = useMemo(() => {
    return rewards.map((reward, index) => {
      const startAngle = index * degreesPerSlice;
      const endAngle = startAngle + degreesPerSlice;
      const midAngle = startAngle + degreesPerSlice / 2;
      const textPoint = polarToCartesian(center, center, textRadius, midAngle);

      return {
        reward,
        midAngle,
        path: describeArcSlice(center, center, radius, startAngle, endAngle),
        textX: textPoint.x,
        textY: textPoint.y,
      };
    });
  }, [center, radius, textRadius, degreesPerSlice]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session") || "";
    setSessionId(session);

    if (!session) {
      setErrorMessage("Missing session.");
      setLoadingSession(false);
      return;
    }

    if (!API_BASE) {
      setErrorMessage("Missing NEXT_PUBLIC_API_BASE_URL in Vercel.");
      setLoadingSession(false);
      return;
    }

    fetch(`${API_BASE}/session-status?sessionId=${encodeURIComponent(session)}`)
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load session status");
        }

        if (data.status === "Completed") {
          setAlreadyUsed(true);
          setResult(data.reward || "");
        }
      })
      .catch((err) => {
        console.error("Failed to load session status:", err);
        setErrorMessage(err.message || "Failed to load session.");
      })
      .finally(() => {
        setLoadingSession(false);
      });
  }, []);

  const spin = () => {
    if (spinning || alreadyUsed || loadingSession || !sessionId || !API_BASE) {
      return;
    }

    setSpinning(true);
    setResult("");
    setErrorMessage("");

    // Re-evaluate eligibility at spin time, even if the page was left open.
    const eligibleRewards = getRewards();
    if (eligibleRewards.length !== rewards.length) {
      setRewards(eligibleRewards);
      setSpinning(false);
      setErrorMessage("Prize options have updated. Please spin again.");
      return;
    }
    const selected = weightedPick(eligibleRewards);
    const selectedIndex = rewards.findIndex((r) => r.value === selected.value);

    const targetSliceCenter = selectedIndex * degreesPerSlice + degreesPerSlice / 2;
    const desiredNormalizedRotation = normalizeAngle(360 - targetSliceCenter);
    const currentNormalizedRotation = normalizeAngle(rotation);
    const correction = normalizeAngle(
      desiredNormalizedRotation - currentNormalizedRotation
    );

    const extraSpins = 360 * (8 + Math.floor(Math.random() * 2));
    const finalRotation = rotation + extraSpins + correction;

    setRotation(finalRotation);

    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE}/complete-spin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            reward: selected.value,
          }),
        });

        const data = await response.json();
        console.log("complete-spin response:", data);

        if (!response.ok) {
          throw new Error(data.details || data.error || "Failed to complete spin");
        }

        const finalReward = data.reward || selected.value;
        setResult(finalReward);
        setAlreadyUsed(true);
      } catch (err) {
        console.error("Error sending result:", err);
        setErrorMessage(err.message || "Failed to save spin result.");
      } finally {
        setSpinning(false);
      }
    }, 4200);
  };


  return (
    <>
      <Head>
        <title>Pitch Health Wheel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <main className="stage">
        <div className="burst" aria-hidden="true" />
        <div className="confetti-field" aria-hidden="true">
          {Array.from({ length: 30 }, (_, index) => (
            <span key={index}
              style={{
                left: `${(index * 37 + 11) % 94 + 3}%`,
                top: `${(index * 29 + 17) % 76 + 12}%`,
                transform: `rotate(${index * 47}deg)`,
                background: index % 3 === 0 ? "#e9ac35" : "#a76ae2",
                opacity: index % 3 === 0 ? 0.8 : 0.5,
              }}
            />
          ))}
        </div>
        <div className="content">
          <header className="header">
            <div className="heading-top">PITCH HEALTH</div>
            <div className="heading-bottom"><span>WHEEL</span></div>
          </header>
          <div className="wheel-area">
            <div className="pointer" aria-hidden="true" />
            <div className="wheel-shell">
              <div className="bulb-ring" aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => {
                  const theta = ((index * 360) / 18 - 90) * Math.PI / 180;
                  return <span key={index} style={{ left: `${50 + 47 * Math.cos(theta)}%`, top: `${50 + 47 * Math.sin(theta)}%` }} />;
                })}
              </div>
              <div
                className="rotating-wheel"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.92, 0.18, 1)" : "none"
                }}
              >
                <svg viewBox={`0 0 ${wheelSize} ${wheelSize}`} width="100%" height="100%" role="img" aria-label="Pitch Health prize wheel">
                  <defs>
                    <radialGradient id="hubFill"><stop offset="0%" stopColor="#8125d2" /><stop offset="78%" stopColor="#32095d" /><stop offset="100%" stopColor="#170628" /></radialGradient>
                    <linearGradient id="goldRim" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fffae2"/><stop offset="23%" stopColor="#f2b837"/><stop offset="52%" stopColor="#9b4d08"/><stop offset="76%" stopColor="#ffe8a4"/><stop offset="100%" stopColor="#ce7d12"/>
                    </linearGradient>
                  </defs>
                  <circle cx={center} cy={center} r="207" fill="#260647" stroke="url(#goldRim)" strokeWidth="6" />
                  <circle cx={center} cy={center} r="198" fill="#2c074f" stroke="#ffda76" strokeWidth="2" />
                  {slices.map((slice, index) => {
                    const isCup = slice.reward.value.startsWith("+");
                    const amount = isCup ? slice.reward.value.split(" ")[0] : slice.reward.value;
                    const angle = slice.midAngle;
                    const iconPoint = polarToCartesian(center, center, 174, angle);
                    // Use upright horizontal text to avoid collisions and upside-down labels.
                    return (
                      <g key={slice.reward.value}>
                        <path
                          d={slice.path}
                          fill={isCup ? ["#ebd3ff", "#bd89f7", "#330a62"][index - cashRewards.length] : ["#39046b", "#7712d5", "#b775f4", "#4c0b80", "#8c24e6", "#290747", "#8021d4", "#b16deb", "#6211ab", "#4a087c"][index % 10]}
                          stroke="#e3baf7" strokeWidth="1.8"
                        />
                        <text
                          x={slice.textX} y={slice.textY - (isCup ? 1 : 0)}
                          textAnchor="middle" dominantBaseline="middle"
                          fill={isCup && index !== cashRewards.length + 2 ? "#3e1169" : "#fff"}
                          fontSize={isCup ? "22" : "22"} fontWeight="900"
                          stroke={isCup && index !== cashRewards.length + 2 ? "rgba(255,255,255,.12)" : "rgba(32,6,61,.42)"}
                          strokeWidth=".8" paintOrder="stroke"
                        >{amount}</text>
                        {isCup ? (
                          <text x={slice.textX} y={slice.textY + 22} textAnchor="middle"
                            fill={index === cashRewards.length + 2 ? "#fff" : "#3e1169"}
                            fontSize="13" fontWeight="900">CUP</text>
                        ) : null}
                        <text x={iconPoint.x} y={iconPoint.y} textAnchor="middle" dominantBaseline="middle"
                          fontSize="17" opacity=".94" fill={isCup && index !== cashRewards.length + 2 ? "#5d138f" : "#ffffff"}>
                          {isCup ? "★" : "$"}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx={center} cy={center} r="47" fill="url(#goldRim)" stroke="#fff0b7" strokeWidth="2" />
                  <circle cx={center} cy={center} r="39" fill="url(#hubFill)" stroke="#e2a733" strokeWidth="2.5" />
                  <text x={center} y={center + 4} textAnchor="middle" dominantBaseline="middle" fontSize="35">🎉</text>
                </svg>
              </div>
            </div>
          </div>
          {result ? (
            <div className="result" role="status">
              <span className="result-icon">🏆</span>
              <span>You won <strong>{result}!</strong></span>
              <span className="result-icon">✨</span>
            </div>
          ) : (
            <button className="spin-button" onClick={spin}
              disabled={spinning || alreadyUsed || loadingSession || !sessionId || !API_BASE}>
              {loadingSession ? "LOADING..." : alreadyUsed ? "✓ USED" : spinning ? "SPINNING..." : "🎡 SPIN"}
            </button>
          )}
          {errorMessage ? <div className="error-message" role="alert">{errorMessage}</div> : null}
        </div>
      </main>
      <style jsx>{`
        * { box-sizing: border-box; }
        .stage { position: relative; overflow: hidden; min-height: 100vh; padding: 20px 16px 36px; display: flex; justify-content: center; align-items: center; font-family: Montserrat,Arial,sans-serif; background: radial-gradient(ellipse at 50% 55%, #efd9ff 0%, #faf3ff 39%, #fff 75%); }
        .burst { position: absolute; inset: 0; pointer-events:none; background: conic-gradient(from -22deg at 50% 53%, transparent 0 13deg, rgba(160,91,223,.09) 13deg 26deg, transparent 26deg 53deg, rgba(139,59,216,.07) 53deg 67deg,transparent 67deg 93deg,rgba(160,91,223,.08) 93deg 105deg,transparent 105deg 360deg); opacity:.8; }
        .content { position: relative; width: 100%; max-width: 820px; text-align: center; z-index:1; }
        .header { margin: 0 auto 6px; position: relative; z-index:2; }
        .heading-top { font-size: clamp(35px,7vw,69px); font-weight:900; line-height:1; letter-spacing:-.055em; color:#531094; text-shadow: 0 3px 0 #c6a2ef, 0 5px 12px #a266bb35; }
        .heading-bottom { display:inline-block; margin-top:2px; padding: 0 32px 4px; border: 3px solid #f2bd53; border-radius: 20px; background:linear-gradient(160deg,#58139c,#28054f); box-shadow: 0 5px 0 #9b5212, 0 10px 28px #8214c14f; transform:rotate(-1deg); }
        .heading-bottom span { font-size:clamp(35px,7vw,62px); font-weight:900; letter-spacing:-.06em; line-height:1.1; color:#ffefd0; text-shadow:0 3px 0 #a76d2b,0 6px 0 #632579; }
        .wheel-area { position:relative; width:min(86vw, 430px, 48vh); margin: 12px auto 0; }
        .wheel-shell { position:relative; width:100%; aspect-ratio:1; border-radius:50%; border:8px solid #f3b649; padding:12px; background: linear-gradient(135deg,#40106e,#1e0839 55%,#7d24b8); box-shadow:0 0 0 4px #5b1499,0 0 0 7px #f5cf71,0 18px 44px #5e088c55,0 0 60px #a724ee6e; }
        .rotating-wheel { width:100%; height:100%; border-radius:50%; overflow:hidden; filter:drop-shadow(0 0 3px #e5a94f); }
        .pointer { position:absolute; top:-14px; left:50%; transform:translateX(-50%); z-index:4; width:0; height:0; border-left:22px solid transparent; border-right:22px solid transparent; border-top:55px solid #e7a52e; filter:drop-shadow(0 3px 2px #5c2359); }
        .pointer:after { content:""; position:absolute; left:-14px; top:-52px; border-left:14px solid transparent; border-right:14px solid transparent; border-top:37px solid #fff0ad; }
        .bulb-ring { position:absolute; inset:0; pointer-events:none; border-radius:50%; z-index:3; }
        .bulb-ring span { position:absolute; width:13px; height:13px; transform:translate(-50%,-50%); background:radial-gradient(circle at 32% 28%,#fff,#ffe8a8 38%,#f5a72c 72%); border:1px solid #fbc95c; border-radius:50%; box-shadow:0 0 7px 3px #ffe494,0 0 13px #fff0a5; }
        .spin-button,.result { margin:16px auto 0; min-height:55px; padding:10px 30px; border-radius:18px; border:3px solid #f5d28a; background:linear-gradient(165deg,#7423bc,#300a55); box-shadow:0 5px 0 #6b247e, 0 10px 26px #5d12965e; color:#fff; font-family:inherit; font-weight:900; font-size:clamp(22px,3vw,29px); }
        .spin-button { cursor:pointer; min-width:220px; }
        .spin-button:disabled { cursor:not-allowed; opacity:.7; }
        .result { display:flex; justify-content:center; align-items:center; gap:14px; width:fit-content; max-width:100%; }
        .result strong { color:#ffd477; }
        .result-icon { font-size:24px; }
        .error-message { margin:15px auto; max-width:550px; color:#ad2525; font-size:14px; font-weight:700; }
        .confetti-field { position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0; }
        .confetti-field span { position:absolute; width:8px; height:18px; border-radius:3px; box-shadow:0 1px 4px #6a23931f; }
        .confetti { position:absolute; z-index:0; width:19px; height:42px; background:linear-gradient(110deg,#fbe29b,#d78c20); border-radius:7px; opacity:.8; transform:rotate(35deg); }
        .confetti-a { left:14%; top:37%; } .confetti-b { right:16%; top:35%; transform:rotate(-34deg); background:linear-gradient(110deg,#ba68ed,#6322ba); } .confetti-c { left:24%; bottom:13%; transform:rotate(-28deg); }
        @media(max-width:560px) { .stage { padding:24px 12px 30px; } .wheel-area { width:min(90vw, 370px, 45vh); margin-top:14px; } .wheel-shell { border-width:5px; padding:8px; } .bulb-ring span { width:9px; height:9px; } .pointer { border-left-width:15px;border-right-width:15px;border-top-width:40px; top:-10px; } .pointer:after { left:-10px; top:-38px; border-left-width:10px; border-right-width:10px; border-top-width:27px; } .heading-bottom { padding:0 24px 3px; border-radius:13px; } .result { gap:7px; padding:12px 14px; } .result-icon { font-size:18px; } }
      `}</style>
    </>
  );
}
