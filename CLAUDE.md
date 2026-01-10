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
