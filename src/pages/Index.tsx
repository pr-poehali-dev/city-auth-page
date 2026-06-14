import { useEffect, useRef, useState } from "react";

const PIXEL = 4;

interface Building {
  x: number;
  width: number;
  height: number;
  color: string;
  windows: { wx: number; wy: number; on: boolean; timer: number }[];
}

function generateBuildings(canvasWidth: number, canvasHeight: number): Building[] {
  const buildings: Building[] = [];
  const colors = ["#1a1a2e", "#16213e", "#0f3460", "#1b1b2f", "#162447", "#1f4068", "#1b262c"];
  let x = 0;
  while (x < canvasWidth + 80) {
    const w = (Math.floor(Math.random() * 10) + 5) * PIXEL;
    const h = (Math.floor(Math.random() * 30) + 10) * PIXEL;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const windows: Building["windows"] = [];
    const cols = Math.floor(w / (PIXEL * 2));
    const rows = Math.floor(h / (PIXEL * 3));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        windows.push({
          wx: c * PIXEL * 2 + PIXEL / 2,
          wy: r * PIXEL * 3 + PIXEL,
          on: Math.random() > 0.4,
          timer: Math.random() * 300,
        });
      }
    }
    buildings.push({ x, width: w, height: h, color, windows });
    x += w + PIXEL;
  }
  return buildings;
}

function PixelCity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const buildingsRef = useRef<Building[]>([]);
  const starsRef = useRef<{ x: number; y: number; t: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildingsRef.current = generateBuildings(canvas.width, canvas.height);
      starsRef.current = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        t: Math.random() * 100,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const draw = () => {
      frame++;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#020818");
      sky.addColorStop(0.6, "#0a1628");
      sky.addColorStop(1, "#0d1f3c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      starsRef.current.forEach((s) => {
        s.t += 0.02;
        const alpha = 0.4 + 0.4 * Math.sin(s.t);
        ctx.fillStyle = `rgba(255,255,220,${alpha})`;
        ctx.fillRect(Math.round(s.x / PIXEL) * PIXEL, Math.round(s.y / PIXEL) * PIXEL, PIXEL, PIXEL);
      });

      ctx.fillStyle = "#fffde7";
      ctx.fillRect(W - 120, 40, PIXEL * 4, PIXEL * 4);
      ctx.fillStyle = "#0a1628";
      ctx.fillRect(W - 120 + PIXEL * 2, 40 + PIXEL, PIXEL, PIXEL);

      const groundY = H - PIXEL * 8;
      buildingsRef.current.forEach((b) => {
        const bx = Math.round(b.x / PIXEL) * PIXEL;
        const by = groundY - b.height;

        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.width, b.height);

        ctx.fillStyle = "#0f0f1a";
        ctx.fillRect(bx + PIXEL, by - PIXEL * 2, b.width - PIXEL * 2, PIXEL * 2);

        if (b.width > PIXEL * 8) {
          ctx.fillStyle = "#1a1a2e";
          ctx.fillRect(bx + b.width / 2 - PIXEL / 2, by - PIXEL * 5, PIXEL, PIXEL * 3);
          const blinkAlpha = Math.sin(frame * 0.05 + b.x) > 0 ? 0.9 : 0.1;
          ctx.fillStyle = `rgba(255,80,80,${blinkAlpha})`;
          ctx.fillRect(bx + b.width / 2 - PIXEL / 2, by - PIXEL * 5, PIXEL, PIXEL);
        }

        b.windows.forEach((w) => {
          w.timer--;
          if (w.timer <= 0) {
            w.on = Math.random() > 0.3;
            w.timer = 100 + Math.random() * 400;
          }
          if (w.on) {
            const warmth = Math.random() > 0.7;
            ctx.fillStyle = warmth ? "#ffe082" : "#b3e5fc";
            ctx.fillRect(bx + w.wx, by + w.wy, PIXEL, PIXEL);
          } else {
            ctx.fillStyle = "#0a0a14";
            ctx.fillRect(bx + w.wx, by + w.wy, PIXEL, PIXEL);
          }
        });
      });

      ctx.fillStyle = "#050d1a";
      ctx.fillRect(0, groundY, W, H - groundY);

      ctx.fillStyle = "#0a1020";
      ctx.fillRect(0, groundY + PIXEL * 2, W, PIXEL * 4);
      for (let rx = 0; rx < W; rx += PIXEL * 8) {
        const dashX = (rx + frame * 0.5) % W;
        ctx.fillStyle = "#1a2840";
        ctx.fillRect(dashX, groundY + PIXEL * 3, PIXEL * 4, PIXEL);
      }

      for (let lx = 60; lx < W; lx += 200) {
        ctx.fillStyle = "#0f1a2e";
        ctx.fillRect(lx, groundY - PIXEL * 6, PIXEL, PIXEL * 6);
        ctx.fillStyle = "#1a2e40";
        ctx.fillRect(lx - PIXEL * 2, groundY - PIXEL * 7, PIXEL * 4, PIXEL);
        const glow = ctx.createRadialGradient(lx, groundY - PIXEL * 7, 0, lx, groundY - PIXEL * 7, 30);
        glow.addColorStop(0, "rgba(255,220,100,0.25)");
        glow.addColorStop(1, "rgba(255,220,100,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(lx - 30, groundY - PIXEL * 7 - 20, 60, 40);
        ctx.fillStyle = "#ffe082";
        ctx.fillRect(lx, groundY - PIXEL * 7, PIXEL, PIXEL);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function Index() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      <PixelCity />

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "11px", color: "#facc15", letterSpacing: "0.1em" }}>
            🏙️ ГОРОДОК
          </span>
        </div>
        <div className="flex gap-1">
          {["Главная", "Регистрация", "Соглашение"].map((item) => (
            <a
              key={item}
              href="#"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px" }}
              className="px-3 py-2 text-blue-200/70 hover:text-yellow-400 transition-colors duration-200 hover:bg-white/5 rounded tracking-wide"
            >
              {item}
            </a>
          ))}
        </div>
      </nav>

      {/* Auth Form */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-sm mx-4">
          <div
            className="relative"
            style={{
              background: "rgba(5, 13, 30, 0.93)",
              border: "2px solid #1e3a5f",
              boxShadow: "0 0 0 1px #0a1628, 0 0 40px rgba(30,58,95,0.6), 0 0 80px rgba(10,22,40,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500/40" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500/40" />

            <div className="p-8">
              <div className="text-center mb-8">
                <span className="text-3xl block mb-3">🏙️</span>
                <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "11px", color: "#facc15", letterSpacing: "0.15em" }}>
                  ГОРОДОК
                </h1>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent my-3" />
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "rgba(147,197,253,0.5)", letterSpacing: "0.12em" }}>
                  ВХОД В СИСТЕМУ
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "rgba(147,197,253,0.7)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                    ЛОГИН
                  </label>
                  <div
                    className="relative"
                    style={{
                      border: `2px solid ${focused === "login" ? "#3b82f6" : "#1e3a5f"}`,
                      background: "rgba(10,22,40,0.8)",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <input
                      type="text"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      onFocus={() => setFocused("login")}
                      onBlur={() => setFocused(null)}
                      placeholder="введите логин"
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", caretColor: "#facc15", letterSpacing: "0.05em" }}
                      className="w-full bg-transparent px-3 py-3 text-blue-100 outline-none placeholder:text-blue-900/50"
                    />
                    {focused === "login" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-3 bg-yellow-400 animate-pulse" />
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", color: "rgba(147,197,253,0.7)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                    ПАРОЛЬ
                  </label>
                  <div
                    className="relative"
                    style={{
                      border: `2px solid ${focused === "pass" ? "#3b82f6" : "#1e3a5f"}`,
                      background: "rgba(10,22,40,0.8)",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("pass")}
                      onBlur={() => setFocused(null)}
                      placeholder="введите пароль"
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", caretColor: "#facc15", letterSpacing: "0.05em" }}
                      className="w-full bg-transparent px-3 py-3 pr-10 text-blue-100 outline-none placeholder:text-blue-900/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500/60 hover:text-blue-300 transition-colors text-sm"
                    >
                      {showPass ? "👁" : "🔒"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="w-full mt-6 py-3 transition-all duration-150 active:scale-95 active:translate-y-px"
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.15em",
                  background: "linear-gradient(180deg, #1e4080 0%, #0f2040 100%)",
                  border: "2px solid #3b82f6",
                  color: "#facc15",
                  boxShadow: "0 0 12px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "linear-gradient(180deg, #2a55a8 0%, #1a3060 100%)";
                  el.style.boxShadow = "0 0 24px rgba(59,130,246,0.6), inset 0 1px 0 rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "linear-gradient(180deg, #1e4080 0%, #0f2040 100%)";
                  el.style.boxShadow = "0 0 12px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)";
                }}
              >
                ▶ ВОЙТИ
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-blue-900/50" />
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "6px", color: "rgba(30,58,95,0.9)" }}>ИЛИ</span>
                <div className="flex-1 h-px bg-blue-900/50" />
              </div>

              <div className="flex justify-between">
                <a
                  href="#"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", letterSpacing: "0.05em" }}
                  className="text-blue-400/70 hover:text-yellow-400 transition-colors"
                >
                  Регистрация
                </a>
                <a
                  href="#"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "7px", letterSpacing: "0.05em" }}
                  className="text-blue-400/40 hover:text-blue-300 transition-colors"
                >
                  Забыл пароль?
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mt-4 gap-2">
            <div className="w-2 h-2 rounded-none bg-green-400 animate-pulse" />
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "6px", color: "rgba(74,222,128,0.6)", letterSpacing: "0.12em" }}>
              СЕРВЕР ОНЛАЙН
            </span>
            <div className="w-2 h-2 rounded-none bg-green-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
