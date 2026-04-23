import { useState } from "react";

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

function getReward() {
  const total = rewards.reduce((a, b) => a + b.weight, 0);
  let rand = Math.random() * total;

  for (const r of rewards) {
    if (rand < r.weight) return r.value;
    rand -= r.weight;
  }
}

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState("");
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    const reward = getReward();
    const randomRotation = 3600 + Math.random() * 360;

    setRotation(rotation + randomRotation);

    setTimeout(() => {
      setResult(reward);
      setSpinning(false);
    }, 3000);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px", color: "white", background: "black", height: "100vh" }}>
      <h1>🔥 PITCH HEALTH WHEEL 🔥</h1>

      <div
        style={{
          margin: "40px auto",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          border: "10px solid orange",
          transform: `rotate(${rotation}deg)`,
          transition: "transform 3s ease-out",
        }}
      />

      <button onClick={spin} style={{ padding: "15px 30px", fontSize: "18px" }}>
        🎡 SPIN
      </button>

      {result && <h2 style={{ marginTop: "20px" }}>🔥 You won {result}</h2>}
    </div>
  );
}
