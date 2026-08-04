import type { GameConfig, Unit, UnitConfig } from "./types";

let nextId = 1;
export const uid = () => nextId++;

export const MAP_W = 1200;
export const MAP_H = 800;

export const WALLS = [
  { x: 480, y: 180, w: 240, h: 14, type: "h" as const },
  { x: 480, y: 180, w: 14, h: 200, type: "v" as const },
  { x: 706, y: 180, w: 14, h: 200, type: "v" as const },
  { x: 480, y: 366, w: 240, h: 14, type: "h" as const },
  { x: 120, y: 320, w: 180, h: 14, type: "h" as const },
  { x: 120, y: 320, w: 14, h: 160, type: "v" as const },
  { x: 286, y: 320, w: 14, h: 160, type: "v" as const },
  { x: 120, y: 466, w: 180, h: 14, type: "h" as const },
  { x: 820, y: 280, w: 200, h: 14, type: "h" as const },
  { x: 820, y: 280, w: 14, h: 180, type: "v" as const },
  { x: 1006, y: 280, w: 14, h: 180, type: "v" as const },
  { x: 820, y: 446, w: 200, h: 14, type: "h" as const },
  { x: 350, y: 500, w: 160, h: 14, type: "h" as const },
  { x: 350, y: 500, w: 14, h: 120, type: "v" as const },
  { x: 496, y: 500, w: 14, h: 120, type: "v" as const },
  { x: 600, y: 100, w: 14, h: 80, type: "v" as const },
  { x: 200, y: 150, w: 120, h: 14, type: "h" as const },
];

export const BUILDINGS = [
  { x: 560, y: 240, type: "castle" as const },
  { x: 180, y: 380, type: "house" as const, roof: "red" as const },
  { x: 880, y: 340, type: "house" as const, roof: "blue" as const },
  { x: 400, y: 540, type: "house" as const, roof: "red" as const },
  { x: 700, y: 140, type: "house" as const, roof: "blue" as const },
  { x: 250, y: 200, type: "house" as const, roof: "red" as const },
  { x: 950, y: 480, type: "house" as const, roof: "red" as const },
];

export const DIRTS = [
  { x: 300, y: 250, w: 120, h: 80 },
  { x: 650, y: 400, w: 150, h: 100 },
  { x: 150, y: 500, w: 100, h: 70 },
  { x: 850, y: 150, w: 90, h: 60 },
  { x: 500, y: 550, w: 130, h: 90 },
];

export const TREES = [
  { x: 80, y: 120 },
  { x: 1100, y: 90 },
  { x: 60, y: 600 },
  { x: 1050, y: 650 },
  { x: 400, y: 80 },
  { x: 900, y: 580 },
  { x: 250, y: 650 },
  { x: 750, y: 50 },
  { x: 550, y: 700 },
];

export const DEFAULT_CONFIG: GameConfig = {
  gameTitle: "吸収大作戦",
  modes: [
    { id: "easy", name: "かんたん", description: "敵が少なくて遅いよ" },
    { id: "normal", name: "ふつう", description: "バランス型" },
    { id: "hard", name: "むずかしい", description: "敵が多くて速い！" },
  ],
  defaultMode: "easy",
  units: {
    easy: [
      { id: "hero1", name: "ゆうしゃくん", side: "blue", count: 95, x: 180, y: 340, speed: 1.3, icon: "🛡️", range: 60 },
      { id: "hero2", name: "まほうつかい", side: "blue", count: 28, x: 260, y: 410, speed: 1.0, icon: "🪄", range: 120, skills: ["warp"] },
      { id: "hero3", name: "けんし", side: "blue", count: 52, x: 140, y: 270, speed: 1.9, icon: "⚔️", range: 55 },
      { id: "hero_echigoya", name: "えちごや", side: "blue", count: 40, x: 220, y: 480, speed: 1.4, icon: "💣", range: 55, skill: "bomb", skills: ["bomb"], bombDamage: 25 },
      { id: "custom1", name: "カスタム兵", side: "blue", count: 35, x: 300, y: 300, speed: 1.6, icon: "⭐", range: 70, skills: ["warp"], scale: 1.1, chipRate: 0.003 },
      { id: "enemy1", name: "スライム", side: "red", count: 42, x: 880, y: 340, speed: 0.4, icon: "🟢", range: 50 },
      { id: "enemy2", name: "コウモリ", side: "red", count: 24, x: 840, y: 440, speed: 1.5, icon: "🦇", range: 50 },
      { id: "enemy3", name: "ゴブリン", side: "red", count: 22, x: 940, y: 250, speed: 0.75, icon: "👺", range: 50 },
      { id: "enemy4", name: "おばけ", side: "red", count: 24, x: 780, y: 500, speed: 0.65, icon: "👻", range: 50 },
      { id: "enemy5", name: "ちびドラゴン", side: "red", count: 16, x: 990, y: 400, speed: 0.5, icon: "🐉", range: 50 },
    ],
    normal: [
      { id: "hero1", name: "ゆうしゃくん", side: "blue", count: 80, x: 180, y: 340, speed: 1.3, icon: "🛡️", range: 60 },
      { id: "hero2", name: "まほうつかい", side: "blue", count: 25, x: 260, y: 410, speed: 1.0, icon: "🪄", range: 120, skills: ["warp"] },
      { id: "hero3", name: "けんし", side: "blue", count: 45, x: 140, y: 270, speed: 1.85, icon: "⚔️", range: 55 },
      { id: "enemy1", name: "スライム", side: "red", count: 60, x: 880, y: 340, speed: 0.4, icon: "🟢", range: 50 },
      { id: "enemy2", name: "コウモリ", side: "red", count: 36, x: 840, y: 440, speed: 1.5, icon: "🦇", range: 50 },
      { id: "enemy3", name: "ゴブリン", side: "red", count: 38, x: 940, y: 250, speed: 0.75, icon: "👺", range: 50 },
      { id: "enemy4", name: "おばけ", side: "red", count: 43, x: 780, y: 500, speed: 0.65, icon: "👻", range: 50 },
      { id: "enemy5", name: "ドラゴン", side: "red", count: 33, x: 990, y: 400, speed: 0.55, icon: "🐉", range: 50 },
    ],
    hard: [
      { id: "hero1", name: "ゆうしゃくん", side: "blue", count: 65, x: 180, y: 340, speed: 1.25, icon: "🛡️", range: 60 },
      { id: "hero2", name: "まほうつかい", side: "blue", count: 7, x: 260, y: 410, speed: 1.0, icon: "🪄", range: 120, skills: ["warp"] },
      { id: "hero3", name: "けんし", side: "blue", count: 38, x: 140, y: 270, speed: 1.8, icon: "⚔️", range: 55 },
      { id: "enemy1", name: "キングスライム", side: "red", count: 91, x: 880, y: 340, speed: 0.35, icon: "🟢", range: 50 },
      { id: "enemy2", name: "バンパイア", side: "red", count: 50, x: 840, y: 440, speed: 1.55, icon: "🦇", range: 50 },
      { id: "enemy3", name: "オーガ", side: "red", count: 75, x: 940, y: 250, speed: 0.45, icon: "👺", range: 50 },
      { id: "enemy4", name: "リッチ", side: "red", count: 50, x: 780, y: 500, speed: 0.55, icon: "👻", range: 50 },
      { id: "enemy5", name: "レッドドラゴン", side: "red", count: 52, x: 990, y: 400, speed: 0.5, icon: "🐉", range: 50 },
      { id: "enemy6", name: "ゴーレム", side: "red", count: 54, x: 700, y: 200, speed: 0.3, icon: "🗿", range: 50 },
    ],
  },
};

export function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function moveTowards(
  from: { x: number; y: number },
  to: { x: number; y: number },
  speed: number,
) {
  const d = dist(from, to);
  if (d < 1) return { ...from };
  const ratio = Math.min(speed / d, 1);
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

export function createUnitsFromConfig(config: GameConfig, modeId: string): Unit[] {
  const list: UnitConfig[] =
    (config.units && config.units[modeId]) || config.units.easy || [];
  return list.map((u) => {
    const isMage = u.name === "まほうつかい" || u.icon === "🪄";
    const defaultRange = isMage ? 120 : u.side === "blue" ? 55 : 50;
    let skills: string[] = [];
    if (Array.isArray(u.skills)) skills = [...u.skills];
    if (u.skill) skills.push(u.skill);
    if (isMage && !skills.includes("warp")) skills.push("warp");
    skills = [...new Set(skills.filter(Boolean))];
    return {
      id: u.id || uid(),
      name: u.name || (u.side === "blue" ? "味方" : "敵"),
      icon: u.icon || (u.side === "blue" ? "⚔️" : "👹"),
      x: u.x ?? 200,
      y: u.y ?? 300,
      count: Math.max(1, u.count ?? 30),
      color: u.side === "blue" ? "blue" : "red",
      target: null,
      speed: u.speed ?? (u.side === "blue" ? 1.5 : 0.7),
      range: u.range ?? defaultRange,
      skill: skills[0] || null,
      skills,
      bombDamage: u.bombDamage ?? 20,
      chipRate: u.chipRate ?? null,
      scale: u.scale ?? 1.0,
    };
  });
}
