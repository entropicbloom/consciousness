# Exhibit 3: Cortical Neurons

## Idea {#exhibit-3-idea}

The first two exhibits used artificial networks trained on MNIST, and the relations were structural: cosine similarities between weight vectors. In [Neural networks as mathematical structures of consciousness](#neural-networks-as-mathematical-structures-of-consciousness) we argued that functional connectivity, the statistical relations between the activity of neurons, is the more plausible grounding for a relational structure of experience. This exhibit tests that option on real cortex.

The question is the same as before, with the stimulus in the role of the label. What a visual neuron represents is usually established by relating its activity to a stimulus: it prefers vertical gratings, or it responds to the upper left of the screen. Record a population of neurons while they watch the same movie, compute the correlation of every pair, and discard the movie. Does the correlation matrix alone determine which neuron prefers which orientation, and where each neuron's receptive field lies? If it does, then a neuron's position among the other neurons fixes part of its content, without any stimulus and without any labelled reference neuron.

## Data and setup {#exhibit-3-setup}

Two public datasets. The [MICrONS](https://www.microns-explorer.org/cortical-mm3) release gives 12,894 neurons from a cubic millimetre of mouse visual cortex, with in-vivo responses to a shared natural movie, a fitted digital-twin model of the same neurons, and labels for preferred orientation and receptive-field position. The [Allen Brain Observatory](https://observatory.brain-map.org/visualcoding) gives 33 mice recorded under identical stimuli, which allows the decoder to be tested on animals it never saw.

The decoder is a transformer whose input is the correlation matrix of a sampled population of 512 neurons, one row per neuron, and nothing else. Labels enter only the loss. As in Exhibit 1, the decoder is trained on one set of neurons and scored on neurons it never saw, and on Allen on animals it never saw. It cannot memorise which neuron is which, because every population is a fresh random sample and the rows carry no identity.

On Allen two choices define a run: whether the test neurons come from the training animals (each halved into training and test neurons) or from animals held out entirely, and whether a sampled population is drawn from one animal or from several. The four combinations are shown below. In a single-animal population the correlation matrix is a within-circuit matrix; in a mixed population most entries are correlations between neurons of different animals.

<p align="center">
  <img src="figures/allen-decoder-regimes.png" alt="The four Allen decoder regimes: test neurons from training or held-out animals, populations drawn from one animal or mixed across animals" width="800"/>
</p>

## Results {#exhibit-3-results}

<p align="center">
  <img src="figures/microns-decoder-results.png" alt="Orientation error and receptive-field R-squared of the relational decoder on MICrONS, with coarse cardinal-axis readouts" width="800"/>
</p>

From in-vivo correlations alone, the decoder reads a neuron's preferred orientation to a mean error of 25°, against 45° for an uninformed decoder and 41° for the best constant guess, and its receptive-field position at R² = 0.23. On the noise-free digital twin the numbers are 20° and 0.48. Asked only which cardinal axis a neuron is closer to, it is right for 79% of neurons in vivo and 87% on the twin, against 56% for the majority answer. The obliques are not resolved.

<p align="center">
  <img src="figures/microns-symmetry-frame.png" alt="The class-Gram of orientation is nearly circulant; only its non-circulant part fixes the absolute frame" width="800"/>
</p>

Why is this possible, and why only partly? Averaging the correlations by orientation class gives a matrix that is almost circulant: neighbouring orientations correlate, orthogonal ones anti-correlate, and the pattern repeats around the circle. A circulant matrix is unchanged by every rotation and reflection of the orientation circle, so that part of the relations orders the classes but cannot say which one is vertical. This is exactly the residual ambiguity of the [mathematical structure](#relational-structures-as-unambiguous-representations): a ring has no marked point. The absolute frame comes from a consistent departure from that symmetry. In V1 the neurons preferring 90°, the most common preference, have more similar responses to one another than the neurons of any other orientation, which marks one point on the ring and fixes the rotation. A single marked point does not fix the reflection, which is why the decoder separates horizontal from vertical and cannot separate 45° from 135°. The same symmetry breaking, and nothing else, suffices in a synthetic population.

<p align="center">
  <img src="figures/allen-cross-animal-orientation.png" alt="On Allen, orientation is readable on held-out animals only from populations that mix animals" width="800"/>
</p>

Across the 33 Allen mice, orientation transfers to animals the decoder never saw, but only when a sampled population mixes animals. Populations drawn from a single animal are not decoded measurably better than the best constant guess: an animal supplies a few hundred cells, so its populations overlap heavily and provide little diversity to learn from. For receptive fields, what crosses animals is where each animal's imaged patch looks on the screen, not the layout of neurons within it.

## What this shows {#exhibit-3-conclusion}

Within one brain, a few hundred correlations are enough to place a neuron on the orientation circle and, through a small asymmetry of the cortical correlation structure, to say where on the circle it sits. That is the claim of this site stated for real neurons: content is fixed by position in a relational structure, up to the symmetries of that structure. The full paper, with all controls (label-free training, class-balanced populations, disjoint stimulus halves, a decoder that sees the raw activity as a reference), is in the [repository](https://github.com/entropicbloom/intentionality/tree/microns-ambiguity/microns_ambiguity).
