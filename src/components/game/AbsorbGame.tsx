import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUILDINGS,
  DEFAULT_CONFIG,
  DIRTS,
  MAP_H,
  MAP_W,
  TREES,
  WALLS,
  createUnitsFromConfig,
  dist,
  moveTowards,
  uid,
} from "./config";
import type { GameConfig, Projectile, Unit } from "./types";

type WarpCharge = { x: number; y: number; count: number };
type Fx = { id: number; x: number; y: number };
type Marker = { x: number; y: number; id: number };

export function AbsorbGame() {
  const [paused, setPaused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [moveMarker, setMoveMarker] = useState<Marker | null>(null);
  const [combatFx, setCombatFx] = useState<Fx[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [won, setWon] = useState(false);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [currentMode, setCurrentMode] = useState(
    DEFAULT_CONFIG.defaultMode || "easy",
  );
  const [showHelp, setShowHelp] = useState(true);
  const [warpCharge, setWarpCharge] = useState<WarpCharge | null>(null);
  const [units, setUnits] = useState<Unit[]>(() =>
    createUnitsFromConfig(DEFAULT_CONFIG, DEFAULT_CONFIG.defaultMode || "easy"),
  );
  const [scale, setScale] = useState(1);
  const [viewSize, setViewSize] = useState({ w: 1200, h: 800 });

  const unitsRef = useRef(units);
  const selectedRef = useRef(selectedId);
  const pausedRef = useRef(paused);
  const gameSpeedRef = useRef(gameSpeed);
  const currentModeRef = useRef(currentMode);
  const frameRef = useRef(0);
  const warpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warpTargetRef = useRef<{ x: number; y: number } | null>(null);
  const updateGameRef = useRef<() => void>(() => {});

  useEffect(() => {
    unitsRef.current = units;
  }, [units]);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    gameSpeedRef.current = gameSpeed;
  }, [gameSpeed]);
  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  useEffect(() => {
    fetch("/units-config.json")
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: GameConfig) => {
        setConfig(data);
        const mode = data.defaultMode || "easy";
        setCurrentMode(mode);
        setUnits(createUnitsFromConfig(data, mode));
        setWon(false);
        setSelectedId(null);
      })
      .catch(() => {
        /* use DEFAULT_CONFIG */
      });
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewSize({ w, h });
      setScale(Math.min(w / MAP_W, h / MAP_H));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const cancelWarp = useCallback(() => {
    if (warpTimerRef.current) {
      clearInterval(warpTimerRef.current);
      warpTimerRef.current = null;
    }
    setWarpCharge(null);
    warpTargetRef.current = null;
  }, []);

  const switchMode = (modeId: string) => {
    if (modeId === currentMode) return;
    setCurrentMode(modeId);
    setUnits(createUnitsFromConfig(config, modeId));
    setWon(false);
    setSelectedId(null);
    setProjectiles([]);
    setPaused(false);
    cancelWarp();
  };

  const playAgain = () => {
    setUnits(createUnitsFromConfig(config, currentMode));
    setWon(false);
    setSelectedId(null);
    setProjectiles([]);
    setPaused(false);
    cancelWarp();
  };

  const updateGame = useCallback(() => {
    const speedMul = gameSpeedRef.current;

    setUnits((prev) => {
      let next = prev.map((u) => ({ ...u }));
      const blue = next.filter((u) => u.color === "blue" && u.count > 0);
      const mode = currentModeRef.current;

      next = next.map((u) => {
        if (u.count <= 0) return u;
        if (u.target) {
          const pos = moveTowards(u, u.target, u.speed * speedMul);
          const reached = dist(pos, u.target) < 8;
          return { ...u, x: pos.x, y: pos.y, target: reached ? null : u.target };
        }
        if (u.color === "red" && blue.length > 0) {
          const weakerTargets = blue.filter((b) => b.count < u.count);
          let target: Unit | null = null;
          if (weakerTargets.length > 0) {
            target = weakerTargets.reduce((a, b) =>
              dist(u, a) < dist(u, b) ? a : b,
            );
          } else if (mode === "easy") {
            target = blue.reduce((a, b) => (dist(u, a) < dist(u, b) ? a : b));
          }
          if (target && dist(u, target) > 40) {
            const pos = moveTowards(u, target, u.speed * 0.7 * speedMul);
            return { ...u, x: pos.x, y: pos.y };
          }
        }
        return u;
      });

      const fx: Fx[] = [];
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const a = next[i];
          const b = next[j];
          if (a.color === b.color || a.count <= 0 || b.count <= 0) continue;

          const d = dist(a, b);
          const aRange = a.range || 50;
          const bRange = b.range || 50;
          const aCanHit = d <= aRange;
          const bCanHit = d <= bRange;
          if (!aCanHit && !bCanHit) continue;

          if (aCanHit && bCanHit) {
            let strongIdx: number;
            let weakIdx: number;
            if (a.count > b.count) {
              strongIdx = i;
              weakIdx = j;
            } else if (b.count > a.count) {
              strongIdx = j;
              weakIdx = i;
            } else {
              strongIdx = a.color === "blue" ? i : j;
              weakIdx = strongIdx === i ? j : i;
            }
            const strong = next[strongIdx];
            const weak = next[weakIdx];
            const baseRate = 0.025 * speedMul;
            const diffBonus = Math.min(0.03, (strong.count - weak.count) / 500);
            let absorb = Math.max(
              1,
              Math.floor(weak.count * (baseRate + diffBonus)),
            );
            absorb = Math.min(absorb, weak.count);
            next[strongIdx] = { ...strong, count: strong.count + absorb };
            next[weakIdx] = {
              ...weak,
              count: Math.max(0, weak.count - absorb),
            };
          } else {
            const chipRateBase = 0.002 * speedMul;
            if (aCanHit && !bCanHit) {
              const rate = (a.chipRate ?? chipRateBase / speedMul) * speedMul;
              const chance = b.count * rate;
              if (Math.random() < chance) {
                next[j] = { ...b, count: Math.max(0, b.count - 1) };
              }
            }
            if (bCanHit && !aCanHit) {
              const rate = (b.chipRate ?? chipRateBase / speedMul) * speedMul;
              const chance = a.count * rate;
              if (Math.random() < chance) {
                next[i] = { ...a, count: Math.max(0, a.count - 1) };
              }
            }
          }

          if (frameRef.current % Math.max(3, Math.floor(10 / speedMul)) === 0) {
            fx.push({ id: uid(), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
          }
        }
      }

      if (fx.length) {
        setCombatFx((prevFx) => [...prevFx, ...fx].slice(-8));
        setTimeout(() => {
          setCombatFx((curr) =>
            curr.filter((f) => !fx.find((nf) => nf.id === f.id)),
          );
        }, 400);
      }

      next = next.filter((u) => u.count > 0);

      const remainingRed = next.filter((u) => u.color === "red").length;
      if (remainingRed === 0 && next.some((u) => u.color === "blue")) {
        setWon(true);
      }

      return next;
    });

    setProjectiles((prev) =>
      prev
        .map((p) => {
          const pos = moveTowards(p, p.target, 4.5 * speedMul);
          const reached = dist(pos, p.target) < 10;
          if (reached) {
            setUnits((us) =>
              us.map((u) => {
                if (u.color === "red" && dist(u, p.target) < 60) {
                  return { ...u, count: Math.max(0, u.count - p.dmg) };
                }
                return u;
              }),
            );
            return null;
          }
          return { ...p, x: pos.x, y: pos.y };
        })
        .filter(Boolean) as Projectile[],
    );
  }, []);

  useEffect(() => {
    updateGameRef.current = updateGame;
  }, [updateGame]);

  useEffect(() => {
    let animId = 0;
    const tick = () => {
      if (!pausedRef.current) {
        frameRef.current++;
        updateGameRef.current();
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const isWarpUnitSelected = () => {
    const sel = unitsRef.current.find((u) => u.id === selectedRef.current);
    if (!sel) return false;
    const skills = sel.skills || (sel.skill ? [sel.skill] : []);
    return (
      skills.includes("warp") ||
      sel.name === "まほうつかい" ||
      sel.icon === "🪄"
    );
  };

  const getMapPos = (
    e: React.MouseEvent | React.TouchEvent,
    el: HTMLElement,
  ) => {
    const rect = el.getBoundingClientRect();
    const clientX =
      "clientX" in e
        ? e.clientX
        : e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const clientY =
      "clientY" in e
        ? e.clientY
        : e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
    return {
      x: ((clientX - rect.left) / rect.width) * MAP_W,
      y: ((clientY - rect.top) / rect.height) * MAP_H,
    };
  };

  const handleMapPointerDown = (
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    if (paused || won) return;
    const el = e.currentTarget as HTMLElement;
    const { x: mx, y: my } = getMapPos(e, el);

    if (selectedRef.current && isWarpUnitSelected()) {
      cancelWarp();
      warpTargetRef.current = { x: mx, y: my };
      setWarpCharge({ x: mx, y: my, count: 4 });
      let count = 4;
      warpTimerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          if (warpTimerRef.current) clearInterval(warpTimerRef.current);
          warpTimerRef.current = null;
          const target = warpTargetRef.current;
          if (target) {
            setUnits((prev) =>
              prev.map((u) =>
                u.id === selectedRef.current
                  ? { ...u, x: target.x, y: target.y, target: null }
                  : u,
              ),
            );
            setMoveMarker({ x: target.x, y: target.y, id: uid() });
            setTimeout(() => setMoveMarker(null), 600);
          }
          setWarpCharge(null);
          warpTargetRef.current = null;
        } else {
          setWarpCharge((prev) => (prev ? { ...prev, count } : null));
        }
      }, 1000);
      return;
    }

    if (selectedRef.current) {
      setUnits((prev) =>
        prev.map((u) =>
          u.id === selectedRef.current
            ? { ...u, target: { x: mx, y: my } }
            : u,
        ),
      );
      setMoveMarker({ x: mx, y: my, id: uid() });
      setTimeout(() => setMoveMarker(null), 800);
    }
  };

  const handleMapPointerUp = () => {
    if (warpTimerRef.current && warpTargetRef.current) {
      const { x, y } = warpTargetRef.current;
      setUnits((prev) =>
        prev.map((u) =>
          u.id === selectedRef.current ? { ...u, target: { x, y } } : u,
        ),
      );
      setMoveMarker({ x, y, id: uid() });
      setTimeout(() => setMoveMarker(null), 800);
      cancelWarp();
    }
  };

  const launchBomb = useCallback(() => {
    if (pausedRef.current || !selectedRef.current) return;
    const sel = unitsRef.current.find((u) => u.id === selectedRef.current);
    if (!sel) return;
    const skills = sel.skills || (sel.skill ? [sel.skill] : []);
    if (!skills.includes("bomb")) return;
    const reds = unitsRef.current.filter((u) => u.color === "red");
    if (reds.length === 0) return;
    const nearest = reds.reduce((a, b) =>
      dist(sel, a) < dist(sel, b) ? a : b,
    );
    const base = sel.bombDamage || 20;
    setProjectiles((prev) => [
      ...prev,
      {
        id: uid(),
        x: sel.x,
        y: sel.y,
        target: { x: nearest.x, y: nearest.y },
        dmg: base + Math.floor(Math.random() * 15),
      },
    ]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        launchBomb();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [launchBomb]);

  const remainingEnemies = units.filter((u) => u.color === "red").length;
  const totalBlue = units
    .filter((u) => u.color === "blue")
    .reduce((s, u) => s + u.count, 0);

  return (
    <div className="absorb-game-root game-container">
      <div className="map-bg" />

      <div
        style={{
          position: "absolute",
          width: MAP_W,
          height: MAP_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          left: (viewSize.w - MAP_W * scale) / 2,
          top: (viewSize.h - MAP_H * scale) / 2,
        }}
        onMouseDown={handleMapPointerDown}
        onMouseUp={handleMapPointerUp}
        onMouseLeave={handleMapPointerUp}
        onTouchStart={handleMapPointerDown}
        onTouchEnd={handleMapPointerUp}
      >
        {DIRTS.map((d, i) => (
          <div
            key={i}
            className="dirt"
            style={{ left: d.x, top: d.y, width: d.w, height: d.h }}
          />
        ))}

        {TREES.map((t, i) => (
          <div key={i} className="tree" style={{ left: t.x, top: t.y }} />
        ))}

        {WALLS.map((w, i) => (
          <div
            key={i}
            className={`wall ${w.type === "h" ? "horizontal" : "vertical"}`}
            style={{ left: w.x, top: w.y, width: w.w, height: w.h }}
          />
        ))}

        {BUILDINGS.map((b, i) => (
          <div
            key={i}
            className={`building ${b.type} ${b.roof === "blue" ? "blue-roof" : ""}`}
            style={{ left: b.x, top: b.y }}
          >
            <div className="roof" />
            {b.type === "castle" && (
              <>
                <div className="tower" style={{ left: 4 }} />
                <div className="tower" style={{ right: 4 }} />
              </>
            )}
          </div>
        ))}

        <div className="treasure" style={{ left: 160, top: 480 }} />
        <div className="treasure" style={{ left: 720, top: 520 }} />

        {units.map((u) => (
          <div
            key={`range-${u.id}`}
            className={`range-circle ${u.color}${selectedId === u.id ? " selected" : ""}`}
            style={{
              left: u.x,
              top: u.y,
              width: (u.range || 50) * 2,
              height: (u.range || 50) * 2,
            }}
          />
        ))}

        {units.map((u) => (
          <div
            key={u.id}
            className={`unit-group ${u.color}${selectedId === u.id ? " selected" : ""}`}
            style={{
              left: u.x,
              top: u.y,
              transform: `translate(-50%, -50%) scale(${u.scale || 1})`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              cancelWarp();
              if (u.color === "blue") {
                setSelectedId((prev) => (prev === u.id ? null : u.id));
              }
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              cancelWarp();
              if (u.color === "blue") {
                setSelectedId((prev) => (prev === u.id ? null : u.id));
              }
            }}
          >
            <div className="unit-label">
              <div className="unit-icon">
                {u.icon || (u.color === "blue" ? "⚔️" : "👹")}
              </div>
              <div className="unit-name">
                {u.name || (u.color === "blue" ? "味方" : "敵")}
              </div>
            </div>
            <div className="count-bubble">{u.count}</div>
            <div className="soldiers">
              {Array.from({
                length: Math.min(9, Math.ceil(u.count / 10)),
              }).map((_, i) => (
                <div key={i} className="soldier" />
              ))}
            </div>
          </div>
        ))}

        {projectiles.map((p) => (
          <div key={p.id} className="projectile" style={{ left: p.x, top: p.y }}>
            <div className="dmg">-{p.dmg}</div>
          </div>
        ))}

        {combatFx.map((f) => (
          <div
            key={f.id}
            className="combat-fx"
            style={{ left: f.x, top: f.y }}
          />
        ))}

        {moveMarker && (
          <div
            className="move-marker"
            style={{ left: moveMarker.x, top: moveMarker.y }}
          />
        )}

        {warpCharge && (
          <div
            className="warp-indicator"
            style={{ left: warpCharge.x, top: warpCharge.y }}
          >
            <div className="warp-count">{warpCharge.count}</div>
          </div>
        )}
      </div>

      <div className="top-bar">
        <div className="game-title">{config.gameTitle || "吸収大作戦"}</div>
        {(config.modes || []).map((m) => (
          <button
            key={m.id}
            type="button"
            className={`mode-tab ${m.id}${currentMode === m.id ? " active" : ""}`}
            onClick={() => switchMode(m.id)}
            title={m.description || ""}
          >
            {m.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="pause-btn"
        onClick={() => setPaused((p) => !p)}
      >
        {paused ? "▶" : "❚❚"}
      </button>

      <div className="bottom-info">
        敵残数：{remainingEnemies}　自軍総数：{totalBlue}
      </div>

      <div className="speed-selector">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            type="button"
            className={`speed-btn${gameSpeed === s ? " active" : ""}`}
            onClick={() => setGameSpeed(s)}
          >
            x{s}
          </button>
        ))}
      </div>

      {!won && showHelp && (
        <div className="instructions">
          <button
            type="button"
            className="close-btn"
            onClick={() => setShowHelp(false)}
            title="閉じる"
          >
            ×
          </button>
          <strong>操作方法</strong>
          <br />
          ・味方をタップで選択
          <br />
          ・マップをタップで移動
          <br />
          ・warpスキル：長押しでワープ
          <br />
          ・青い円＝味方範囲／赤い円＝敵範囲
          <br />
          ・お互いの範囲内 → 大きい方が吸収
          <br />
          ・片方の範囲だけ → 遠距離で少し削れる
          <br />
          ・bombスキル：スペースで爆弾
          <br />
          ・上のタブでモード変更／左下で速度
          <br />
          ・敵をぜんぶ吸収すれば勝ち！
        </div>
      )}

      {won && (
        <div className="victory-overlay">
          <div className="victory-box">
            <div className="victory-emoji">🎉</div>
            <div className="victory-title">しょうり！</div>
            <div className="victory-sub">敵をぜんぶ吸収したよ！すごい！</div>
            <button type="button" className="victory-btn" onClick={playAgain}>
              もういっかい あそぶ
            </button>
          </div>
        </div>
      )}

      {paused && !won && (
        <div className="pause-overlay">
          <div className="pause-menu">
            <div
              className="pause-option leave"
              onClick={() => setPaused(false)}
              role="button"
              tabIndex={0}
            >
              <div className="icon">🏃</div>
              <div className="label">離脱</div>
            </div>
            <div
              className="pause-option retry"
              onClick={playAgain}
              role="button"
              tabIndex={0}
            >
              <div className="icon">🔄</div>
              <div className="label">やり直し</div>
            </div>
            <div
              className="pause-option continue"
              onClick={() => setPaused(false)}
              role="button"
              tabIndex={0}
            >
              <div className="icon">▶</div>
              <div className="label">続行</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
