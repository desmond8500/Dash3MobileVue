/**
 * Nomenclature Galaxy Dimension.
 *
 * Sur le clavier de la centrale Honeywell Galaxy, un libellé (zone,
 * utilisateur…) se saisit caractère par caractère sous forme de code à
 * deux chiffres. Cette table reprend celle de la page « Nomenclature
 * Galaxy » de Dash3.
 */
export const GALAXY_CODES: Readonly<Record<string, string>> = {
  " ": "10",
  a: "13",
  b: "15",
  c: "16",
  d: "17",
  e: "18",
  f: "19",
  g: "20",
  h: "22",
  i: "23",
  j: "24",
  k: "25",
  l: "26",
  m: "27",
  n: "28",
  o: "31",
  p: "33",
  q: "34",
  r: "35",
  s: "36",
  t: "37",
  u: "38",
  v: "40",
  w: "41",
  x: "42",
  y: "44",
  z: "45",
  "0": "00",
  "1": "01",
  "2": "02",
  "3": "03",
  "4": "04",
  "5": "05",
  "6": "06",
  "7": "07",
  "8": "08",
  "9": "09",
};

/** Longueur maximale d'un libellé Galaxy */
export const GALAXY_MAX_LENGTH = 16;

export interface GalaxyChar {
  /** Caractère tapé */
  char: string;
  /** Code clavier, ou null si le caractère n'existe pas dans la table */
  code: string | null;
}

export interface GalaxyResult {
  input: string;
  /** Texte réellement converti (coupé à la longueur maximale) */
  text: string;
  chars: GalaxyChar[];
  /** Codes des caractères reconnus, dans l'ordre */
  codes: string[];
  /** Caractères ignorés car absents de la table */
  unknown: string[];
  /** Le texte dépassait la longueur maximale */
  truncated: boolean;
}

/**
 * Ramène un caractère à son entrée dans la table :
 * minuscule et sans accent (à → a, é/è/ê → e, ç → c…).
 */
function normalizeChar(char: string): string {
  return char
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Code Galaxy d'un caractère, ou null s'il n'est pas pris en charge */
export function galaxyCode(char: string): string | null {
  return GALAXY_CODES[normalizeChar(char)] ?? null;
}

/** Convertit un libellé en suite de codes Galaxy */
export function convertGalaxy(input: string, maxLength = GALAXY_MAX_LENGTH): GalaxyResult {
  const all = Array.from(input);
  const truncated = all.length > maxLength;
  const kept = all.slice(0, maxLength);

  const chars = kept.map((char) => ({ char, code: galaxyCode(char) }));
  return {
    input,
    text: kept.join(""),
    chars,
    codes: chars.filter((c) => c.code !== null).map((c) => c.code as string),
    unknown: [...new Set(chars.filter((c) => c.code === null).map((c) => c.char))],
    truncated,
  };
}

/** Convertit plusieurs libellés : une ligne non vide = un libellé */
export function convertGalaxyLines(text: string, maxLength = GALAXY_MAX_LENGTH): GalaxyResult[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "")
    .map((l) => convertGalaxy(l, maxLength));
}
