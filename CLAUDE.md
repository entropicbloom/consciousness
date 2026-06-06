# Project Instructions

## Compiling the Paper

To regenerate the PDF from the LaTeX source:

```bash
cd paper
pdflatex -interaction=nonstopmode main.tex
bibtex main
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex
```

Clean up auxiliary files afterward:

```bash
rm -f main.aux main.bbl main.blg main.log main.out main.toc
```

## Regenerating Figures

Figure generation scripts are in `/Users/flaessig/Documents/intentionality/`. See `FIGURE_INDEX.md` in that directory for details.

Key figures:
- **Gram matrix decoder (Fig 3)**: `cd gram_matrix_decoder && python -c "from runs.classid_comparison import run_comparison_experiment; run_comparison_experiment()"`
- **Self-attention decoder (Fig 1)**: `cd decoder && python self_attention_decoder_comparison.py`
- **MNIST accuracies (Fig 2)**: `python decoder/underlying_mnist_performance_real.py`
- **R² comparison (Fig 8)**: `cd decoder && python r2_comparison_bar_chart_with_error_bars.py`

After regenerating, copy the updated PNGs to `paper/`.
