// src/core/labels.js

/**
 * Zentrale Label-Definitionen für Kasus, Numerus, Genus usw.
 * 
 * Idee:
 * - Ein Ort, an dem alle Anzeige-Texte gepflegt werden.
 * - Verhindert Copy-Paste über mehrere Dateien.
 */

export const CASE_LABELS = {
    Nom: "Nominativ",
    Gen: "Genitiv",
    Dat: "Dativ",
    Akk: "Akkusativ",
    Abl: "Ablativ",
    Vok: "Vokativ"
};

export const NUMBER_LABELS = {
    Sg: "Singular",
    Pl: "Plural"
};

export const GENDER_LABELS = {
    m: "maskulin",
    f: "feminin",
    n: "neutrum"
};

/**
 * Liefert eine schön ausgeschriebene Kombination,
 * z.B. (Nom, Sg, m) -> "Nominativ Singular maskulin"
 */
export function formatCaseNumberGender(opt) {
    if (!opt) return "";
    const c = CASE_LABELS[opt.case] || opt.case || "";
    const n = NUMBER_LABELS[opt.number] || opt.number || "";
    const g = GENDER_LABELS[opt.gender] || opt.gender || "";
    return [c, n, g].filter(Boolean).join(" ");
}
