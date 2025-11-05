# Unambiguous Representations in Neural Networks: A Relational Structure Approach to Consciousness

This directory contains the LaTeX source for a journal paper suitable for submission to Entropy or similar journals.

## Structure

The paper is divided into modular sections for easier editing and collaboration:

- `main.tex` - Main document using MDPI template (for Entropy journal)
- `main-article.tex` - Alternative version using standard article class (easier to compile)
- `references.bib` - BibTeX bibliography
- `sections/` - Individual section files:
  - `00-abstract.tex` - Abstract placeholder (abstract is in main.tex preamble)
  - `01-introduction.tex` - Introduction
  - `02-theory.tex` - Theoretical framework
  - `03-methods.tex` - Methods
  - `04-experiment1.tex` - Experiment 1: MNIST digit classification
  - `05-experiment2.tex` - Experiment 2: Spatial position decoding
  - `06-ambiguity-analysis.tex` - Quantifying representational ambiguity
  - `07-discussion.tex` - Discussion and related work
  - `08-conclusion.tex` - Conclusion

## Compilation

### Option 1: Standard Article Class (Recommended for initial editing)

```bash
cd paper
pdflatex main-article.tex
bibtex main-article
pdflatex main-article.tex
pdflatex main-article.tex
```

### Option 2: MDPI Template (For final submission to Entropy)

1. Download the MDPI LaTeX template from: https://www.mdpi.com/authors/latex
2. Extract the `mdpi.cls` file to a `Definitions/` directory in this folder
3. Compile:

```bash
cd paper
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

### Using LaTeXmk (automatic compilation)

```bash
latexmk -pdf main-article.tex
# or
latexmk -pdf main.tex
```

## Figures

The paper references figures in `../figures/` directory. Ensure all figure files are present:

- `pixel-encoding-relational-structure.png`
- `decoder-validation-accuracy-training-paradigms.png`
- `mnist-model-validation-accuracies.png`
- `target-similarity-only-output-neurons.png`
- `ablation-study-neuron-count-performance.png`
- `perm_distances_no_dropout.png`
- `perm_distances_dropout.png`
- `architecture-transfer-evaluation.png`
- `cross_architecture_heatmap_accuracy.png`
- `gram_neuron_ablation_plot.png`
- `dataset-classification-accuracy.png`
- `umap-input-neuron-similarity.png`
- `input-neuron-distance-prediction-accuracy.png`
- `target-similarity-only-input-pixels.png`
- `varying-subset-size-input-pixels.png`
- `knn-kernel-similarity-vs-decoder-accuracy.png`

## Modular Structure Benefits

The paper is divided into separate files to:

1. **Facilitate collaboration** - Multiple authors can work on different sections simultaneously
2. **Version control** - Git diffs are cleaner when sections are separate files
3. **Easier editing** - Work on one section at a time without navigating a large file
4. **Reusability** - Individual sections can be reused or reorganized easily

## Customization

To customize for different journals:

1. Edit the preamble in `main.tex` or `main-article.tex`
2. Adjust formatting, citation style, figure sizes as needed
3. The modular structure means section content doesn't need to change

## Abstract and Keywords

The abstract is defined in the preamble of `main.tex` (for MDPI template) and at the beginning of `main-article.tex` (for standard article class). Update there to modify the abstract.

Keywords are also defined in the same locations.

## Citation Management

All references are in `references.bib`. Add new references there in BibTeX format. Citations in the text use `\cite{key}` format, where `key` matches the BibTeX entry key.

## Contributing

When making changes:

1. Keep section files focused on their specific content
2. Maintain consistent formatting across sections
3. Test compilation after major changes
4. Update this README if structure changes

## License

[Add appropriate license information]

## Contact

[Add contact information]
