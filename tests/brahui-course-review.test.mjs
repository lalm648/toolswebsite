import test from "node:test";
import assert from "node:assert/strict";

import { itemFingerprint, applyReviews } from "../scripts/course/review.mjs";

test("the fingerprint depends on the Brahui and the English, not on the item id", () => {
  /*
    Ids are positional — "u2l1i3" — so they move whenever a unit is re-cut.
    Approval has to survive that, which means it keys on the sentence itself.
  */
  const a = itemFingerprint({ id: "u2l1i3", br: "kar-oŧ", en: "I will do" });
  const b = itemFingerprint({ id: "u4l2i9", br: "kar-oŧ", en: "I will do" });
  assert.equal(a, b);
});

test("changing the Brahui invalidates the fingerprint", () => {
  const a = itemFingerprint({ br: "kar-oŧ", en: "I will do" });
  const b = itemFingerprint({ br: "karr-oŧ", en: "I will do" });
  assert.notEqual(a, b);
});

test("an approved item is marked ok", () => {
  const item = { br: "kar-oŧ", en: "I will do", src: "gen", review: "pending" };
  const ledger = { approved: { [itemFingerprint(item)]: "2026-09-20" } };

  const [out] = applyReviews([item], ledger);
  assert.equal(out.review, "ok");
});

test("an unapproved generated item stays pending", () => {
  const item = { br: "mar-oŧ", en: "I will become", src: "gen", review: "pending" };
  const [out] = applyReviews([item], { approved: {} });
  assert.equal(out.review, "pending");
});

test("an attested corpus item is ok without any approval", () => {
  /*
    A sentence the corpus contains is already native Brahui. Asking a speaker to
    re-approve the source text would flood the queue and stall the course.
  */
  const item = { br: "mass-uŧa", en: "I become", src: "corp", review: "ok" };
  const [out] = applyReviews([item], { approved: {} });
  assert.equal(out.review, "ok");
});

test("an edited sentence loses its old approval", () => {
  const original = { br: "kar-oŧ", en: "I will do", src: "gen", review: "pending" };
  const ledger = { approved: { [itemFingerprint(original)]: "2026-09-20" } };

  const edited = { br: "kar-oŧ", en: "I shall do", src: "gen", review: "pending" };
  const [out] = applyReviews([edited], ledger);
  assert.equal(out.review, "pending");
});

test("approval ignores case and surrounding space in the English", () => {
  /*
    A reviewer retyping a gloss should not silently revoke their own approval
    over a capital letter.
  */
  const a = itemFingerprint({ br: "kar-oŧ", en: "I will do" });
  const b = itemFingerprint({ br: "kar-oŧ", en: "  i will do " });
  assert.equal(a, b);
});

test("applyReviews does not mutate its input", () => {
  const item = { br: "kar-oŧ", en: "I will do", src: "gen", review: "pending" };
  const ledger = { approved: { [itemFingerprint(item)]: "2026-09-20" } };

  applyReviews([item], ledger);
  assert.equal(item.review, "pending");
});

test("a missing or malformed ledger leaves everything pending rather than throwing", () => {
  /*
    The ledger is hand-edited and downloaded from the review screen, so it will
    sometimes arrive empty or half-written. Failing closed keeps unreviewed
    Brahui away from learners; throwing would break the whole build.
  */
  const item = { br: "kar-oŧ", en: "I will do", src: "gen", review: "pending" };
  assert.equal(applyReviews([item], null)[0].review, "pending");
  assert.equal(applyReviews([item], {})[0].review, "pending");
});
