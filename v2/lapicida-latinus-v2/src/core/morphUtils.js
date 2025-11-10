// src/core/morphUtils.js

import { formatCaseNumberGender } from "./labels";

/**
 * Fisher-Yates-Shuffle
 * (mutiert niemals das Original-Array)
 */
export function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Baut die Anzeige für eine Nomen-Analyse.
 * Hier NUR die deutsche Bedeutung zurückgeben,
 * die Kasus/Num/Genus-Info wird in der UI aus formatCaseNumberGender() gebaut.
 *
 * So vermeiden wir Doppelungen wie:
 * "Dativ Singular maskulin – Dativ Singular maskulin – Freund".
 */
export function buildNounDeLabel({ lemmaDe }) {
    return lemmaDe || "";
}

/**
 * Kombiniert in der UI:
 *  - ausgeschriebene Kasus-Num-Genus-Angabe
 *  - deutsche Bedeutung (optional)
 */
export function buildFullNounLine(opt) {
    const left = formatCaseNumberGender(opt);
    const right = opt.de ? opt.de : "";
    return right ? `${left} – ${right}` : left;
}
