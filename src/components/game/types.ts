export type Side = "blue" | "red";
export type Skill = "bomb" | "warp" | string;

export type UnitConfig = {
  id?: string;
  name?: string;
  icon?: string;
  side: Side | string;
  count?: number;
  x?: number;
  y?: number;
  speed?: number;
  range?: number;
  skill?: Skill | null;
  skills?: Skill[];
  bombDamage?: number;
  chipRate?: number | null;
  scale?: number;
};

export type ModeInfo = {
  id: string;
  name: string;
  description?: string;
};

export type GameConfig = {
  gameTitle?: string;
  modes?: ModeInfo[];
  defaultMode?: string;
  units: Record<string, UnitConfig[]>;
};

export type Unit = {
  id: string | number;
  name: string;
  icon: string;
  x: number;
  y: number;
  count: number;
  color: Side;
  target: { x: number; y: number } | null;
  speed: number;
  range: number;
  skill: Skill | null;
  skills: Skill[];
  bombDamage: number;
  chipRate: number | null;
  scale: number;
};

export type Projectile = {
  id: number;
  x: number;
  y: number;
  target: { x: number; y: number };
  dmg: number;
};

export type Point = { x: number; y: number };
