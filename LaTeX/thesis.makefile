ALL_FIGURE_NAMES=$(shell cat thesis.figlist)
ALL_FIGURES=$(ALL_FIGURE_NAMES:%=%.pdf)

allimages: $(ALL_FIGURES)
	@echo All images exist now. Use make -B to re-generate them.

FORCEREMAKE:

-include $(ALL_FIGURE_NAMES:%=%.dep)

%.dep:
	mkdir -p "$(dir $@)"
	touch "$@" # will be filled later.

ext-tikz/thesis-figure0.pdf: 
	pdflatex -halt-on-error -interaction=batchmode -jobname "ext-tikz/thesis-figure0" "\def\tikzexternalrealjob{thesis}\input{thesis}"

ext-tikz/thesis-figure0.pdf: ext-tikz/thesis-figure0.md5
