# surface — launch readiness (Week 3 go/no-go)

This file closes the "should we launch?" question. It separates **objective evidence**
(reproducible, already green) from **manual gates** (Diego's call, can't be automated).

## Evidence gates

| Gate | Type | How to check | Status |
|------|------|--------------|--------|
| Routing correct on canonical cases | auto | `npm test` → Part A | ✅ 7/7 |
| Generated artifacts well-formed | auto | `npm test` → Part B | ✅ 6/6 |
| Example gallery renders | visual | open `examples/index.html` | ✅ 6 artifacts |
| ≥10 real conversations logged | **manual** | `ITERATION-LOG.md` filled | ⬜ pending |
| Article finalized + companion link | **manual** | draft done, links repo + gallery | ⬜ pending |
| 5–7 screenshots/gifs | **manual** | derive from `examples/` | ⬜ pending |

The auto gates are reproducible by anyone: `npm install && npm test`. The negative test
(flip one `expect.format` in `evals.json` → `npm test` exits 1) confirms the harness is real,
not a rubber stamp.

## Decision rule

**GO** only when every gate above is checked. Until the real-usage log gate is green,
status = **HOLD**. The code being green proves the engine is correct; it does *not* prove
the matrix matches real-world intent — only the conversation log does that.

**Current status: HOLD** — objective evidence is green; manual usage validation is the blocker.

## Synchronized launch sequence (execute only on GO)

Same-day, in this order:

1. Repo already public: `DiegoNogueiraDev/surface-skill`. Tag a release `v0.1.0`.
2. npm: resolve the name first — `surface` is likely taken → publish as `@devnogueira/surface`
   (flip `private: false` in `package.json` and add the missing build/exports beforehand).
3. Submit to `skills.sh`.
4. Publish the article the **same day** as the push (Medium / dev.to / blog), linking the repo
   and `examples/index.html`.
5. Thread on X/LinkedIn (@devnogueira__) with the gallery screenshots.
6. Tag: Thariq Shihipar ([@trq212](https://x.com/trq212)), Simon Willison, Claude Code folks
   who engaged with the original post.

Synchronized beats piecemeal — repo + article + thread + marketplace on one day compound.

## Risks (from the tactical review)

- An unmaintained OSS repo costs reputation, not just effort. Expect 3–5h/week of issues/PRs.
- The code is trivially reimplementable — the moat is the clear thesis, the canonical examples
  in `examples/`, the Skills-standard fit, and Diego's authority via the article.
- **Leaner fallback:** ship the article + the skill on `skills.sh` *without* an actively
  maintained repo, if bandwidth (mcp-graph-workflow, Audicore, metacognition.my, clients)
  is tighter than the launch upside.
