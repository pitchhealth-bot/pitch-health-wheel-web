import Head from "next/head";
import { useMemo, useState } from "react";

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
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
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

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);

  const wheelSize = 520;
  const center = wheelSize / 2;
  const radius = 235;
  const textRadius = 155;
  const degreesPerSlice = 360 / rewards.length;

  const slices = useMemo(() => {
    return rewards.map((reward, index) => {
      const startAngle = index * degreesPerSlice;
      const endAngle = startAngle + degreesPerSlice;
      const midAngle = startAngle + degreesPerSlice / 2;

      const textPoint = polarToCartesian(center, center, textRadius, midAngle);

      return {
        reward,
        index,
        midAngle,
        path: describeArcSlice(center, center, radius, startAngle, endAngle),
        textX: textPoint.x,
        textY: textPoint.y,
      };
    });
  }, [center, radius, textRadius, degreesPerSlice]);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult("");

    const selected = weightedPick(rewards);
    const selectedIndex = rewards.findIndex((r) => r.value === selected.value);

    const targetSliceCenter = selectedIndex * degreesPerSlice + degreesPerSlice / 2;
    const targetRotation = 360 - targetSliceCenter;
    const extraSpins = 360 * (8 + Math.floor(Math.random() * 2));
    const finalRotation = rotation + extraSpins + targetRotation;

    setRotation(finalRotation);

    setTimeout(() => {
      setResult(selected.value);
      setSpinning(false);
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
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          background: "#000000",
          color: "#ffffff",
          fontFamily: "Montserrat, Arial, sans-serif",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px 16px 40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: "0 0 18px",
              fontSize: "clamp(32px, 4.2vw, 60px)",
              fontWeight: 900,
              letterSpacing: "1px",
              lineHeight: 1.05,
            }}
          >
            🎉 PITCH HEALTH WHEEL 🎉
          </h1>

          <div
            style={{
              position: "relative",
              width: "fit-content",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "22px solid transparent",
                borderRight: "22px solid transparent",
                borderTop: "48px solid white",
                margin: "0 auto 12px",
                filter: "drop-shadow(0 0 10px rgba(255,255,255,0.18))",
                position: "relative",
                zIndex: 5,
              }}
            />

            <div
              style={{
                width: "min(68vw, 520px)",
                height: "min(68vw, 520px)",
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
                  filter: "drop-shadow(0 0 22px rgba(147, 51, 234, 0.28))",
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

                  <circle cx={center} cy={center} r={248} fill="#A855F7" />
                  <circle cx={center} cy={center} r={241} fill="#6D28D9" />

                  {slices.map((slice, index) => {
                    const textRotation = slice.midAngle;
                    return (
                      <g key={slice.reward.value}>
                        <path
                          d={slice.path}
                          fill={segmentColors[index % segmentColors.length]}
                          stroke="rgba(255,255,255,0.85)"
                          strokeWidth="3"
                        />
                        <text
                          x={slice.textX}
                          y={slice.textY}
                          fill="#FFFFFF"
                          fontSize="26"
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
                    r={54}
                    fill="url(#centerGlow)"
                    stroke="#A855F7"
                    strokeWidth="10"
                  />
                  <circle cx={center} cy={center} r={20} fill="#0b0412" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={spin}
            disabled={spinning}
            style={{
              marginTop: "24px",
              background: "linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "20px",
              padding: "18px 38px",
              fontSize: "clamp(22px, 2.8vw, 30px)",
              fontWeight: 800,
              cursor: spinning ? "not-allowed" : "pointer",
              boxShadow: "0 0 26px rgba(168, 85, 247, 0.45)",
              opacity: spinning ? 0.75 : 1,
              minWidth: "230px",
            }}
          >
            🎡 SPIN
          </button>

          <div
            style={{
              minHeight: "52px",
              marginTop: "22px",
              fontSize: "clamp(24px, 2.8vw, 38px)",
              fontWeight: 800,
              color: result ? "#C084FC" : "#ffffff",
            }}
          >
            {result ? `🎉 You won ${result}` : ""}
          </div>
        </div>
      </div>
    </>
  );
}
