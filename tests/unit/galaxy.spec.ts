import { describe, expect, test } from "vitest";
import { convertGalaxy, convertGalaxyLines, galaxyCode } from "@/utils/galaxy";

describe("galaxyCode", () => {
  test("lettres, chiffres et espace", () => {
    expect(galaxyCode("a")).toBe("13");
    expect(galaxyCode("Z")).toBe("45");
    expect(galaxyCode(" ")).toBe("10");
    expect(galaxyCode("0")).toBe("00");
    expect(galaxyCode("9")).toBe("09");
  });

  test("les accents prennent le code de la lettre de base", () => {
    expect(galaxyCode("à")).toBe("13");
    expect(galaxyCode("é")).toBe("18");
    expect(galaxyCode("È")).toBe("18");
    expect(galaxyCode("ç")).toBe("16");
  });

  test("caractère absent de la table", () => {
    expect(galaxyCode("-")).toBe(null);
  });
});

describe("convertGalaxy", () => {
  test("convertit un libellé", () => {
    const r = convertGalaxy("Salon 1");
    expect(r.codes).toEqual(["36", "13", "26", "31", "28", "10", "01"]);
    expect(r.unknown).toEqual([]);
    expect(r.truncated).toBe(false);
  });

  test("coupe à 16 caractères", () => {
    const r = convertGalaxy("Detecteur chambre parents");
    expect(r.text).toBe("Detecteur chambr");
    expect(r.codes.length).toBe(16);
    expect(r.truncated).toBe(true);
  });

  test("ignore et signale les caractères non pris en charge", () => {
    const r = convertGalaxy("RDC-1");
    expect(r.codes).toEqual(["35", "17", "16", "01"]);
    expect(r.unknown).toEqual(["-"]);
  });
});

describe("convertGalaxyLines", () => {
  test("une ligne non vide = un libellé", () => {
    const r = convertGalaxyLines("Salon\n\n  \nCuisine\r\n Garage ");
    expect(r.map((x) => x.text)).toEqual(["Salon", "Cuisine", "Garage"]);
  });
});
