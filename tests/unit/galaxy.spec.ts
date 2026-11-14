import { describe, expect, test } from "vitest";
import { convertGalaxy, convertGalaxyLines } from "@/utils/galaxy";

describe("convertGalaxy", () => {
  test("retire les accents et passe en majuscules", () => {
    expect(convertGalaxy("Salon été").output).toBe("SALON ETE");
    expect(convertGalaxy("Cœur").output).toBe("COEUR");
  });

  test("laisse intact un texte assez court", () => {
    const r = convertGalaxy("Garage");
    expect(r.output).toBe("GARAGE");
    expect(r.abbreviated).toBe(false);
    expect(r.truncated).toBe(false);
  });

  test("abrège seulement ce qu'il faut pour tenir dans 16 caractères", () => {
    const r = convertGalaxy("Détecteur chambre parents");
    expect(r.output).toBe("DET CH PARENTS");
    expect(r.output.length).toBeLessThanOrEqual(16);
    expect(r.abbreviated).toBe(true);
  });

  test("retire les élisions et mots de liaison", () => {
    expect(convertGalaxy("Porte d'entrée principale").output).toBe("PORTE ENT PPLE");
  });

  test("abrège un mot collé à une parenthèse", () => {
    expect(convertGalaxy("Bureau n°2 (1er étage)").output).toBe("BUR N 2 (1ER ET)");
  });

  test("coupe et le signale quand l'abréviation ne suffit pas", () => {
    const r = convertGalaxy("Contact magnétique porte garage sous-sol");
    expect(r.output.length).toBeLessThanOrEqual(16);
    expect(r.truncated).toBe(true);
  });

  test("respecte les options", () => {
    expect(convertGalaxy("Détecteur chambre", { uppercase: false }).output).toBe("Det chambre");
    expect(convertGalaxy("Détecteur chambre parents", { abbreviate: false }).output).toBe("DETECTEUR CHAMBR");
    expect(convertGalaxy("Cuisine", { maxLength: 4 }).output).toBe("CUIS");
  });
});

describe("convertGalaxyLines", () => {
  test("une ligne non vide = un libellé", () => {
    const r = convertGalaxyLines("Salon\n\n  \nCuisine\r\nGarage");
    expect(r.map((x) => x.output)).toEqual(["SALON", "CUISINE", "GARAGE"]);
  });
});
