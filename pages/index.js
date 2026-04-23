import { useState } from "react";

const rewards = [
  "$25",
  "$30",
  "$35",
  "$40",
  "$45",
  "$50",
  "$55",
  "$60",
  "$65",
  "$70",
];

const colors = [
  "#f97316",
  "#fb923c",
  "#ea580c",
  "#fdba74",
  "#f97316",
  "#fb923c",
  "#ea580c",
  "#fdba74",
  "#f97316",
  "#fb923c",
];

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult("");

    const randomIndex = Math.floor(Math.random() * rewards.length);
    const reward = rewards[randomIndex];

    const degreesPerSlice = 360 / rewards.length;
    const finalRotation =
      3600 + (360 - randomIndex * degreesPerSlice - degreesPerSlice / 2);

    setRotation(rotation + finalRotation);

    setTimeout(() => {
      setResult(reward);
      setSpinning(false);
    }, 3000);
  };

  return (
    <div style={{ background: "black", color: "white", textAlign: "center", height: "100vh", paddingTop: "30px" }}>
      <h1>🔥 PITCH HEALTH WHEEL 🔥</h1>

      {/* POINTER */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "15px solid transparent",
          borderRight: "15px solid transparent",
          borderBottom: "30px solid white",
          margin: "0 auto",
        }}
      />

      {/* WHEEL */}
      <div
        style={{
          margin: "20px auto",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          border: "8px solid orange",
          transform: `rotate(${rotation}deg)`,
          transition: "transform 3s ease-out",
          background: `conic-gradient(
            ${rewards
              .map(
                (_, i) =>
                  `${colors[i]} ${i * 36}deg ${(i + 1) * 36}deg`
              )
              .join(",")}
          )`,
        }}
      />

      <button
        onClick={spin}
        disabled={spinning}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          borderRadius: "10px",
          marginTop: "20px",
          background: spinning ? "#555" : "orange",
          color: "white",
          border: "none",
          cursor: spinning ? "not-allowed" : "pointer",
        }}
      >
        {spinning ? "Spinning..." : "🎡 SPIN"}
      </button>

      {result && (
        <h2 style={{ marginTop: "20px" }}>🔥 You won {result}</h2>
      )}
    </div>
  );
}
