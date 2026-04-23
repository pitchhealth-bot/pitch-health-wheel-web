import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

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
  const textRadius = 128;
  const degreesPerSlice = 360 / rewards.length;

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

    const selected = weightedPick(rewards);
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
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          fontFamily: "Montserrat, Arial, sans-serif",
          backgroundColor: "#f6f3f8",
          backgroundImage: 'url("/web background.png")',
          backgroundRepeat: "repeat",
          backgroundSize: "520px auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px 16px 36px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "980px",
            textAlign: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          <h1
            style={{
              margin: "0 0 18px",
              fontSize: "clamp(26px, 4vw, 56px)",
              fontWeight: 900,
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              color: "#6e42ae",
              textShadow: "0 2px 0 rgba(255,255,255,0.45)",
            }}
          >
            🎉 PITCH HEALTH WHEEL 🎉
          </h1>

          <div style={{ position: "relative", width: "fit-content", margin: "0 auto" }}>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "22px solid transparent",
                borderRight: "22px solid transparent",
                borderTop: "46px solid #6e42ae",
                margin: "0 auto 10px",
                filter: "drop-shadow(0 0 8px rgba(110,66,174,0.32))",
                position: "relative",
                zIndex: 5,
              }}
            />

            <div
              style={{
                width: "min(56vw, 430px)",
                height: "min(56vw, 430px)",
                margin: "0 auto",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 4.2s cubic-bezier(0.12, 0.92, 0.18, 1)"
                    : "none",
                  filter: "drop-shadow(0 0 22px rgba(110, 66, 174, 0.26))",
                }}
              >
                <svg
                  viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                >
                  <defs>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#2E1065" />
                      <stop offset="100%" stopColor="#12051f" />
                    </radialGradient>
                  </defs>

                  <circle cx={center} cy={center} r={204} fill="#B085F5" stroke="#ffffff" strokeWidth="3" />
                  <circle cx={center} cy={center} r={198} fill="#8D5DE8" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" />

                  {slices.map((slice, index) => {
                    const textRotation = slice.midAngle;
                    return (
                      <g key={slice.reward.value}>
                        <path
                          d={slice.path}
                          fill={segmentColors[index % segmentColors.length]}
                          stroke="#ffffff"
                          strokeWidth="2.8"
                        />
                        <text
                          x={slice.textX}
                          y={slice.textY}
                          fill="#FFFFFF"
                          stroke="rgba(46,16,101,0.65)"
                          strokeWidth="0.9"
                          paintOrder="stroke"
                          fontSize="20"
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${textRotation}, ${slice.textX}, ${slice.textY})`}
                        >
                          {slice.reward.value}
                        </text>
                      </g>
                    );
                  })}

                  <circle
                    cx={center}
                    cy={center}
                    r={45}
                    fill="url(#centerGlow)"
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                  <circle cx={center} cy={center} r={18} fill="#0b0412" stroke="#C084FC" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={spin}
            disabled={spinning || alreadyUsed || loadingSession || !sessionId || !API_BASE}
            style={{
              marginTop: "22px",
              background: "linear-gradient(135deg, #6e42ae 0%, #8D5DE8 100%)",
              color: "#FFFFFF",
              border: "2px solid rgba(255,255,255,0.75)",
              borderRadius: "18px",
              padding: "16px 34px",
              fontSize: "clamp(20px, 2.6vw, 28px)",
              fontWeight: 800,
              cursor:
                spinning || alreadyUsed || loadingSession || !sessionId || !API_BASE
                  ? "not-allowed"
                  : "pointer",
              boxShadow: "0 0 22px rgba(110, 66, 174, 0.28)",
              opacity:
                spinning || alreadyUsed || loadingSession || !sessionId || !API_BASE
                  ? 0.6
                  : 1,
              minWidth: "210px",
            }}
          >
            {loadingSession
              ? "Loading..."
              : alreadyUsed
              ? "✅ USED"
              : spinning
              ? "🎡 SPINNING..."
              : "🎡 SPIN"}
          </button>

          <div
            style={{
              minHeight: "48px",
              marginTop: "18px",
              fontSize: "clamp(22px, 2.6vw, 34px)",
              fontWeight: 800,
              color: result ? "#6e42ae" : "#1f172c",
              textShadow: result ? "0 2px 0 rgba(255,255,255,0.45)" : "none",
            }}
          >
            {result ? `🎉 You won ${result}` : ""}
          </div>

          {errorMessage ? (
            <div
              style={{
                marginTop: "12px",
                color: "#b42318",
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
