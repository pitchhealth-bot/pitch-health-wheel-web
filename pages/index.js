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

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);

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
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        style={{
          minHeight: "100vh",
          fontFamily: "Montserrat, Arial, sans-serif",
          backgroundColor: "#f7f5f8",
          backgroundImage: 'url("/web background.png")',
          backgroundRepeat: "repeat",
          backgroundSize: "520px auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px 16px 36px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "980px",
            textAlign: "center",
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
                borderLeft: "20px solid transparent",
                borderRight: "20px solid transparent",
                borderTop: "44px solid #ffffff",
                margin: "0 auto 10px",
                filter: "drop-shadow(0 0 8px rgba(0,0,0,0.12))",
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
                  filter: "drop-shadow(0 0 18px rgba(110, 66, 174, 0.28))",
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

                  <circle cx={center} cy={center} r={204} fill="#B085F5" />
                  <circle cx={center} cy={center} r={198} fill="#8D5DE8" />

                  {slices.map((slice, index) => {
                    const textRotation = slice.midAngle;
                    return (
                      <g key={slice.reward.value}>
                        <path
                          d={slice.path}
                          fill={segmentColors[index % segmentColors.length]}
                          stroke="rgba(255,255,255,0.92)"
                          strokeWidth="2.5"
                        />
                        <text
                          x={slice.textX}
                          y={slice.textY}
                          fill="#FFFFFF"
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
                    stroke="#A855F7"
                    strokeWidth="8"
                  />
                  <circle cx={center} cy={center} r={18} fill="#0b0412" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={spin}
            disabled={spinning}
            style={{
              marginTop: "22px",
              background: "linear-gradient(135deg, #6e42ae 0%, #8D5DE8 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "18px",
              padding: "16px 34px",
              fontSize: "clamp(20px, 2.6vw, 28px)",
              fontWeight: 800,
              cursor: spinning ? "not-allowed" : "pointer",
              boxShadow: "0 0 22px rgba(110, 66, 174, 0.28)",
              opacity: spinning ? 0.75 : 1,
              minWidth: "210px",
            }}
          >
            🎡 SPIN
          </button>

          <div
            style={{
              minHeight: "48px",
              marginTop: "18px",
              fontSize: "clamp(22px, 2.6vw, 34px)",
              fontWeight: 800,
              color: result ? "#6e42ae" : "#1f172c",
            }}
          >
            {result ? `🎉 You won ${result}` : ""}
          </div>
        </div>
      </div>
    </>
  );
}
