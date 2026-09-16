# Candidate Brahui entries

`brahui-candidates.tsv` is a staging file, not data that ships. Nothing here
reaches the site until it is merged into `brahui-lexicon-ilcaa.json`, which lives
in the separate `Brahui-to-EN-URDU-Dictionary` repository (see `.gitignore`).
Everything under `public/brahui/` is generated output — editing it directly would
be overwritten by the next `node build-single.js && npm run sync:brahui`.

Screen the file before doing anything with it:

    node scripts/check-brahui-candidates.mjs data/brahui-candidates.tsv

Exit 1 means at least one row needs a human decision. Columns and rules are
documented at the top of that script.

## What is in it now

Six kinship terms checked against *Brahui English Dictionary* (Saleh Muhammad
Shad, Balochi Academy Quetta, 2021). These are reference lookups — individual
facts verified against a published dictionary — not an extraction from it. That
book is all-rights-reserved, so no bulk import from it may ship without written
permission from the publisher.

The check confirmed the seven Urdu kinship loanwords removed in e39d742 (dádí,
dádá, náná, nání, phuphí, xálá, damád) were correctly removed, and that the real
Brahui words for those meanings are already shipping:

| meaning       | Brahui  | status              |
|---------------|---------|---------------------|
| grandfather   | píra    | already in lexicon  |
| grandmother   | balla   | already in lexicon  |
| aunt          | táta    | already in lexicon  |
| son-in-law    | sálum   | already in lexicon  |
| uncle         | illa    | already in lexicon  |
| daughter-in-law | malģuŕ | **new**            |

So the book adds exactly one word here. `malģuŕ` needs a speaker's confirmation
before merging: the romanisation is derived from the book's Urdu script (مَلغُڑ)
using this lexicon's own conventions — ģ as in `bandaģ`, ŕ as in `íŕ`, `maŕd` —
because the book's page-IV transliteration table (gh, ṛ, ṭ, ḍ, ñ) does not map
one-to-one onto Brolikva.

Still missing from the lexicon and worth looking up: **mother-in-law**. The
lexicon has `málum` (father-in-law) and `sálum` (son-in-law) but neither feminine
counterpart, which is what led to `malģuŕ` in the first place.
