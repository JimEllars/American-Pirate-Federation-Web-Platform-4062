# Article XIV — Great Balance methodology note

**Status:** published methodology for `/calculator`
**Version:** 1.0.0 (matches `ARTICLE_XIV.version` in `src/lib/doctrine/articleXIV.js`)
**Source of the parameters:** SOP v1.0.0 §4 Playbook D, which restates Article XIV of The Pirate Code.
**Owner:** policy, not engineering. Engineering implements exactly what is written here.

---

## 1. Why this note exists

SOP Playbook D requires `/calculator` to match Article XIV and forbids inventing the
formula. The 2026-11-02 audit (F12) left the route unbuilt for that reason: the page could
not be written until the composition rule was pinned down in public. This note is that
pinning. It is short on purpose — a reader should be able to check the arithmetic on paper.

## 2. Parameters (fixed by the Article)

| Parameter | Individual | Married filing jointly |
|---|---|---|
| Phase-out floor | $40,000 / year | $60,000 / year |
| Negative income tax rate | 33% | 33% |
| Dependent allowance | $400 / child / month ($4,800 / child / year) | same |

Nothing else in the Article is a number. There is no national cost, no participation rate,
no funding mechanism and no payment schedule in the text, so none of those appear on the
page.

## 3. Composition rule

The Article fixes three numbers but not the order they combine in. The Federation's reading,
implemented in `computeGreatBalance()`:

```
floor      = married ? 60000 : 40000
gap        = max(0, floor − income)
adult      = 0.33 × gap
childGross = children × 4800
childCut   = 0.33 × max(0, income − floor)
child      = max(0, childGross − childCut)
payment    = adult + child          (annual; ÷ 12 for the monthly figure)
```

Three properties follow, and each one is deliberate:

1. **The floor is a top-up, not a cliff.** At $0 income a single adult receives
   `0.33 × 40,000 = $13,200`. At $39,999 they receive $0.33. At $40,000 they receive $0.
   The payment meets the floor from below and then stops; it never pays someone above it for
   being an adult.
2. **Dependents are a separate, additive allowance that phases out at the same 33%.** A
   married household with two children receives $9,600 a year at or below the floor, and
   that allowance is fully recovered at `60,000 + 9,600 / 0.33 = $89,090.91` of income. The
   page displays that endpoint for the household on screen.
3. **No second cliff.** Nothing else is withdrawn as income rises: the marginal treatment of
   an extra dollar above the floor is a flat 33 cent reduction in the dependent allowance
   until it reaches zero.

## 4. Worked examples (these are asserted in `tests/smoke.spec.js`)

| Household | Income | Adult | Dependents | Annual | Monthly |
|---|---|---|---|---|---|
| Individual, 0 children | $32,000 | $2,640 | $0 | $2,640 | $220.00 |
| Married, 2 children | $0 | $19,800 | $9,600 | $29,400 | $2,450.00 |
| Individual, 0 children | $10,000,000 | $0 | $0 | $0 | $0.00 |
| Individual, 0 children | −$5,000 | (read as $0) | $0 | $13,200 | $1,100.00 |

## 5. What the page does not claim

- It is not a benefit determination and not tax advice.
- It does not model federal or state tax liability, which sits outside the Article.
- It does not estimate aggregate cost, take-up, or funding. Those are policy questions with
  no published figures, and Law 1 forbids rendering a plausible-looking number in their
  place.
- It does not persist inputs server-side. Nothing typed into `/calculator` leaves the
  browser; there is no `/api/` call on that route.

## 6. Changing the parameters

`src/lib/doctrine/articleXIV.js` is the only place the numbers live. A change to any of the
three parameters is a change to the Article, so it needs:

1. a doctrine amendment recorded against Article XIV,
2. the constant updated with a new `ARTICLE_XIV.version`,
3. this note updated — including the worked examples, which are also the test fixtures,
4. `tests/smoke.spec.js` expectations updated in the same commit.

The calculator is a reader of doctrine, exactly like `/policies` reads
`src/lib/doctrine/policies.js`. It is not permitted to become a second, unaudited source.
