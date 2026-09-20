/*
  Brahui verb paradigms, harvested from the corpus's interlinear glosses.

  Every example in lexdetail.json is a surface line and a gloss line whose
  tokens correspond one to one:

    kar-oŧ      ne
    do-FUT.1SG  you

  That correspondence is the whole reason a grammar course is buildable from a
  folktale collection. The prose itself is third-person past narration — 6,336
  examples of 3SG against 111 of 2PL — but the glosses spell out the entire
  person system, so the paradigm tables can be recovered even where the running
  text barely uses them.
*/

/* Tags that mark an inflected verb.

   Case and derivation tags — GEN, D/A, ALL, ABL, LOC, ADJ — mark nouns, and are
   deliberately absent: a unit on the person system must not collect "life-GEN"
   as though it were a verb form. Those tags belong to the word-formation unit,
   which reads them separately. */
const INFLECTED = /\b(PST|PRS|IPF|PRF|FUT|SBJV|IMP|COP|CVB|INF|NEG)\b/;

const PERSON = /\b([123])(SG|PL)\b/;

/* A gloss token is a verb form when it reads "stem-TAG" with an uppercase tag.
   The stem is the English gloss the corpus uses ("do", "become"), not Brahui —
   the Brahui is on the surface side, and is what we are harvesting. */
const FORM = /^([a-zA-ZÀ-ɏĀ-ſ]+)-([A-Z][A-Z0-9/.]*)$/;

export function alignExample(surface, gloss) {
  const s = String(surface || "").split(/\s+/).filter(Boolean);
  const g = String(gloss || "").split(/\s+/).filter(Boolean);
  if (!s.length || s.length !== g.length) return null;
  return s.map((token, i) => ({ surface: token, gloss: g[i] }));
}

export function personOf(tag) {
  const m = PERSON.exec(String(tag || ""));
  return m ? m[1] + m[2] : null;
}

export function harvestParadigms(examples) {
  const out = new Map();
  for (const example of examples || []) {
    const pairs = alignExample(example && example[0], example && example[1]);
    if (!pairs) continue;
    for (const { surface, gloss } of pairs) {
      const m = FORM.exec(gloss);
      if (!m) continue;
      const [, stem, tag] = m;
      if (!INFLECTED.test(tag)) continue;
      const form = surface.replace(/[.,!?;:]+$/, "");
      if (!form) continue;
      if (!out.has(stem)) out.set(stem, new Map());
      const forms = out.get(stem);
      /* First attestation wins. A later odd transcription must not displace a
         form the course has already been built around, and it keeps the build
         deterministic — the emitted file is hashed, so a form that changed
         between runs would bust the cache for no reason. */
      if (!forms.has(tag)) forms.set(tag, form);
    }
  }
  return out;
}
