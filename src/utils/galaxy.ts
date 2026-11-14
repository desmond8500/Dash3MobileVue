/**
 * Conversion de textes pour les centrales Honeywell Galaxy Dimension.
 *
 * Les libellés (zones, utilisateurs, groupes…) sont saisis sur un clavier
 * à afficheur limité : longueur maximale (16 caractères par défaut), pas
 * d'accents, jeu de caractères réduit. Cette fonction transforme un texte
 * libre en libellé utilisable tel quel.
 */

export interface GalaxyOptions {
  /** Longueur maximale du libellé */
  maxLength: number;
  /** Passer en majuscules */
  uppercase: boolean;
  /** Abréger les mots courants si le texte est trop long */
  abbreviate: boolean;
}

export const DEFAULT_GALAXY_OPTIONS: GalaxyOptions = {
  maxLength: 16,
  uppercase: true,
  abbreviate: true,
};

/** Caractères conservés en plus des lettres, chiffres et espaces */
const ALLOWED_PUNCTUATION = "-./&+()'";

/** Abréviations utilisées seulement si le texte dépasse la longueur maximale */
const ABBREVIATIONS: Record<string, string> = {
  DETECTEUR: "DET",
  DETECTION: "DET",
  CONTACT: "CT",
  MAGNETIQUE: "MAG",
  INFRAROUGE: "IR",
  VOLUMETRIQUE: "VOL",
  BARRIERE: "BAR",
  SIRENE: "SIR",
  INTERIEURE: "INT",
  INTERIEUR: "INT",
  EXTERIEURE: "EXT",
  EXTERIEUR: "EXT",
  CHAMBRE: "CH",
  PARENTS: "PAR",
  ENFANTS: "ENF",
  ENFANT: "ENF",
  CUISINE: "CUIS",
  SALON: "SAL",
  BUREAU: "BUR",
  COULOIR: "COUL",
  ENTREE: "ENT",
  ESCALIER: "ESC",
  GARAGE: "GAR",
  TERRASSE: "TERR",
  FENETRE: "FEN",
  PORTE: "PTE",
  PORTAIL: "PTL",
  PRINCIPALE: "PPLE",
  PRINCIPAL: "PPL",
  SECONDAIRE: "SEC",
  ARRIERE: "ARR",
  AVANT: "AV",
  GAUCHE: "G",
  DROITE: "D",
  NIVEAU: "NIV",
  ETAGE: "ET",
  "REZ-DE-CHAUSSEE": "RDC",
  "SOUS-SOL": "SS",
  BATIMENT: "BAT",
  MAGASIN: "MAG",
  RECEPTION: "RECEP",
  TECHNIQUE: "TECH",
  LOCAL: "LOC",
  SALLE: "SAL",
  REUNION: "REU",
  TOILETTES: "WC",
  BOUTON: "BP",
  PANIQUE: "PAN",
  INCENDIE: "INC",
  FUMEE: "FUM",
  CLAVIER: "CLAV",
  CENTRALE: "CTRL",
  ALIMENTATION: "ALIM",
  AUTOPROTECTION: "AP",
};

/** Mots de liaison retirés si le texte est trop long */
const STOP_WORDS = new Set(["DE", "DU", "DES", "LA", "LE", "LES", "ET", "A", "AU", "AUX", "EN"]);

export interface GalaxyResult {
  input: string;
  output: string;
  /** Le texte a dû être coupé (il dépasse encore après abréviation) */
  truncated: boolean;
  /** Le texte a été abrégé */
  abbreviated: boolean;
}

/** Retire les accents et remplace les caractères spéciaux */
function clean(text: string, uppercase: boolean): string {
  let s = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[œŒ]/g, (c) => (c === "œ" ? "oe" : "OE"))
    .replace(/[æÆ]/g, (c) => (c === "æ" ? "ae" : "AE"))
    .replace(/ß/g, "ss")
    .replace(/[’‘`´]/g, "'")
    .replace(/[–—_]/g, "-");

  if (uppercase) s = s.toUpperCase();

  const allowed = new RegExp(`[^A-Za-z0-9 ${ALLOWED_PUNCTUATION.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}]`, "g");
  return s.replace(allowed, " ").replace(/\s+/g, " ").trim();
}

/** Applique au mot abrégé la casse du mot d'origine (MAJ, Capitale, minuscule) */
function matchCase(original: string, abbr: string): string {
  if (original === original.toUpperCase()) return abbr.toUpperCase();
  if (original[0] === original[0].toUpperCase()) return abbr[0].toUpperCase() + abbr.slice(1).toLowerCase();
  return abbr.toLowerCase();
}

/** Abrège un mot en gardant la ponctuation qui l'entoure : « (ETAGE) » → « (ET) » */
function abbreviateWord(word: string): string {
  const m = word.match(/^([^A-Za-z0-9]*)([A-Za-z0-9'-]+?)([^A-Za-z0-9]*)$/);
  if (!m) return word;
  const [, before, core, after] = m;
  const abbr = ABBREVIATIONS[core.toUpperCase()];
  return abbr ? before + matchCase(core, abbr) + after : word;
}

/**
 * Raccourcit progressivement jusqu'à tenir dans maxLength :
 * 1. retire les élisions (D', L') et les mots de liaison ;
 * 2. abrège les mots un par un, du plus long au plus court.
 */
function shorten(text: string, maxLength: number): string {
  const fits = (w: string[]) => w.join(" ").length <= maxLength;

  let words = text.split(" ").map((w) => w.replace(/^[DLdl]'/, "")).filter(Boolean);
  if (fits(words)) return words.join(" ");

  words = words.filter((w) => !STOP_WORDS.has(w.toUpperCase()));
  if (fits(words)) return words.join(" ");

  const order = words.map((w, i) => i).sort((a, b) => words[b].length - words[a].length);
  for (const i of order) {
    words[i] = abbreviateWord(words[i]);
    if (fits(words)) break;
  }
  return words.join(" ");
}

export function convertGalaxy(text: string, options: Partial<GalaxyOptions> = {}): GalaxyResult {
  const opts = { ...DEFAULT_GALAXY_OPTIONS, ...options };
  let output = clean(text, opts.uppercase);
  let abbreviated = false;

  if (opts.abbreviate && output.length > opts.maxLength) {
    const short = shorten(output, opts.maxLength);
    abbreviated = short !== output;
    output = short;
  }

  const truncated = output.length > opts.maxLength;
  if (truncated) output = output.slice(0, opts.maxLength).trimEnd();

  return { input: text, output, truncated, abbreviated };
}

/** Convertit un texte multi-lignes : une ligne = un libellé */
export function convertGalaxyLines(text: string, options: Partial<GalaxyOptions> = {}): GalaxyResult[] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => convertGalaxy(l, options));
}
