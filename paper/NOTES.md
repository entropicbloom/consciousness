# Paper Notes / Known Issues

## §3.1.4 Relational Complexity Scaling — metric differs from §3.1.2

The neuron-count ablation (Figure: `ablation-study-neuron-count-performance.png`,
§3.1.4 in `results.tex`, described in §2.1.6 of `methods.tex`) uses a **different
"accuracy" metric** from the main geometric-matching result in §3.1.2 / Figure 3.
The two numbers are not directly comparable, even though both are labelled "accuracy".

**Source:** `repos/intentionality/gram_matrix_decoder/neuron_ablation_experiment.py`
(data: `runs/gram_neuron_ablation_results.csv`).

- **§3.1.2 / Figure 3 — "hard" accuracy.** For each test network, take the single
  permutation with minimum Frobenius distance to the reference (argmin) and score 1
  iff it is exactly correct. Standard backprop = 0.383, dropout = 1.000.
  → *"How often is the true permutation the single best match?"*

- **§3.1.4 / Figure 6 — "soft" rank score.** `accuracy = 1 − (permutations ranked
  better than the true one / total permutations)`. This is the percentile rank of
  the true permutation among all `k!` permutations, not whether it is #1.
  Standard backprop 10-neuron = 0.998.
  → *"What fraction of all permutations are worse than the true one?"*

**Why they look inconsistent:** both the ablation and the main result use the SAME
**standard backprop** networks (`config.py`: `REFERENCE_MODEL_TYPE = EVAL_MODEL_TYPE
= "fully_connected"`, no dropout — verified at the CSV-generating commit `2ef6273`).
A standard-backprop network's true permutation can rank above 99.8% of all
permutations (soft = 0.998) while only rarely being the exact argmin (hard = 0.383).
So 99.8% in §3.1.4 vs 38.3% in Figure 3 is a metric difference, NOT a contradiction,
and NOT a dropout-vs-standard difference.

**Secondary nuance:** §3.1.4 normalizes "relative to random" by `1/k` (the
classification chance level), giving "9.98× better than random" for k=10. But for a
percentile-*rank* score, an uninformative permutation lands at ~the 50th percentile
on average, so the natural chance baseline is ~0.5, not `1/k`. The trend (more
neurons → true permutation stands out more → less ambiguity) holds regardless; only
the "N× better than random" framing depends on the `1/k` baseline choice.

**Status:** not corrected in the text — the result's direction is sound and the
wording is defensible. If a reviewer flags the 99.8% vs 38.3% gap, add a clause in
§3.1.4 clarifying that this score is the true permutation's rank among all
permutations, distinct from the exact-match accuracy of §3.1.2.
