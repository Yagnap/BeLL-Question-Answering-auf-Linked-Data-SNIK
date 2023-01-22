# IMISE LaTeX poster template
Poster in A0 format.
Design based on the LaTeX [baposter](https://github.com/mloesch/baposter) class and one of its [examples](https://github.com/mloesch/baposter/tree/master/examples/graphtrack).

## Setup
Fork this repository into your own GitHub account or [download](https://github.com/IMISE/imise-poster/archive/refs/heads/master.zip) and extract it.
In any case, I recommend you to put your poster into version control.

## Online Editor
If you are a LaTeX beginner or just prefer working in a web editor, you can copy and edit this template on [Overleaf](https://www.overleaf.com/read/bxbbygxjhpdx).

## Develop
* If your poster is in German language, change `\usepackage[english]{babel}` to `\usepackage[ngerman]{babel}` in `poster.tex`
* Add text to `poster.tex`
* Add images to the `img` folder
* Add literature to `poster.bib`

## Compile
Compile the LaTeX file to PDF:

    pdflatex poster.tex
    bibtex poster
    pdflatex poster.tex

If you don't have any literature references, `pdflatex poster.tex` is enough.
If you have `latexmk` installed, you can do it in one command using `latexmk -pdf poster.tex` or under Linux just execute the `compile` script.

## Feedback
If you encounter bugs or have a proposal to improve the template, please [create an issue](https://github.com/IMISE/imise-poster/issues/new).

