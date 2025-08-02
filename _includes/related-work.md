# Other Work on Representational Alignment

## The Platonic Representation Hypothesis
Huh et al.’s mutual k-NN kernel-similarity, originally applied to large cross-modal models, is also closely linked to decoder accuracy (and thus ambiguity reduction) in our small MNIST networks. Here, we compute the metric by comparing the weights of output neurons across MNIST networks trained with different seeds. This relationship suggests that, if the pattern holds, higher kernel-similarity should indicate lower representational ambiguity even in larger, multimodal settings.

<p align="center">
  <img src="figures/knn-kernel-similarity-vs-decoder-accuracy.png" alt="kNN Kernel Similarity vs. Decoding Accuracy" width="600"/>
</p>


