# Exhibit 2: Input Neuron Representation

## Idea

In the previous exhibit we showed strong evidence for abstract digits being represented in an unambiguous relational structure that can be leveraged to identify class identity from randomly shuffled output neurons. However, because of the abstract nature of class identity, the link to phenomenal consciousness might be unintuitive. This is especially true if one thinks of phenomenal consciousness as applying more to the sensory than the abstract.

So, let's turn the tables and look at input neurons! This links back to the introductory example of the 2D grid in [Relational structures as unambiguous representations](#relational-structures-as-unambiguous-representations). In this case, we know that the input neurons represent a grid of input pixels, as that's how they are used in a forward pass. But is there a sense in which this information is intrinsic to the network connectivity? To frame it as a decoding problem: Given the first layer weight matrix with permuted columns (where rows correspond to the neurons of the first hidden layer and columns to input neurons), can we infer positional information about input neurons? While the strictest version of this task would be to identify the exact coordinates of an input neuron, we can also consider weaker versions, such as identifying only one coordinate, or the proximity to the center.

Please note that only considering one layer for this decoding task serves several purposes:

1. It simplifies our experiment and leaves fewer degrees of freedom for operationalization.
2. It precludes solutions to the decoding task that involve passing sample inputs through the whole network, e.g. for testing to what extent input neurons affect output neurons for different inputs.

Moreover, since we will apply the same cosine similarity preprocessing step as in the previous experiment, we can also prevent other 'trivial' solution methods such as inferring positional information from the norm of the outgoing weights of an input neuron.

Preliminary visualizations using UMAP on the cosine similarity matrix between input neurons already suggest that some positional information is present and decodable relationally.

<p align="center">
  <img src="figures/fig6.png" alt="Figure 6" width="600"/>
</p>

## Machine learning setup

To operationalize this idea, we cast it as a supervised learning problem. We define a function $$f(i, j)$$ that extracts some form of positional information from an input neuron's location $$(i, j)$$ in the 28x28 grid. The decoder's task is not to learn the function $$f$$ itself, but to predict the value of $$f(i, j)$$ **given only the relational representation** of that neuron relative to all other neurons. In other words, the decoder must infer $$f(i, j)$$ **without knowing the values of $$i$$ or $$j$$**, purely from the context provided by connectivity structure.

Example functions $$f(i, j)$$ include:

- $$f(i, j) = (i / 27, j / 27)$$ for normalized 2D position.
- $$f(i, j) = i / 27$$ for normalized horizontal position.
- $$f(i, j) = j / 27$$ for normalized vertical position.
- $$f(i, j) = \sqrt{(i - 13.5)^2 + (j - 13.5)^2}$$ for distance from center.

This formulation lets us probe different levels of representational structure and ambiguity.

We again use a Set Transformer architecture that is invariant to permutations of the input columns (beyond the first), ensuring that the decoder can only rely on relational information for solving the task. The first column is treated specially because the decoder is trained to predict the positional information of the neuron occupying that column, based on its similarity to all other input neurons.

Note that this contrasts with Exhibit 1, where the decoder predicted output neuron class based on incoming weight **rows**; here, we operate on **columns** representing outgoing weights of input neurons.

## Dataset

To create training examples, we generate multiple neural networks with the same architecture but different initialization seeds. For each network, we extract the input weight matrix $$W$$ of shape (784, H), where 784 corresponds to input neurons (pixels), and H is the number of hidden units in the first layer.

To build one training example:

- We permute the columns of $$W$$, destroying any trivial positional information.
- We select one of the columns (i.e., one input neuron) and place it in the first position.
- The input $$X$$ to the decoder is then the full permuted weight matrix.
- The label $$y$$ is $$f(i, j)$$ for the input neuron that ended up in the first column.

Crucially, the decoder is never given access to the coordinates $$(i, j)$$ directly—it only sees the connectivity patterns between neurons (encoded in the similarity matrix), and must infer positional information from those alone.

## Preprocessing

To make the decoder task explicitly relational, we compute a cosine similarity matrix $$X'$$ from the **column vectors** of $$W$$. This differs from Exhibit 1, where similarities were computed between row vectors (i.e., incoming weights to output neurons). Here, each column represents the outgoing weights of an input neuron into the hidden layer, and their pairwise similarities define a relational structure over input neurons:

$$
X_{norm} = \frac{X}{\|X\|_{col}}, \quad\quad X' = X_{norm}^T X_{norm}
$$

We feed the similarity matrix $$X'$$ to a Set Transformer-based decoder. This preprocessing emphasizes relational structure by encoding how similar each input neuron is to every other in terms of their effect on the next layer.

## Results
![Figure 7](figures/fig7.png)
First, we can establish that this task is also solvable, suggesting that relational information encoded in the input neuron outgoing weights is sufficient to determine distance from the center of the pixel they represent (except for the untrained control networks, which serve as a sanity check for our experimental setup). The next most salient observation is that, unlike in the output layer experiment, adding dropout to the underlying network degrades decoding performance in this case. 

Analogous to Exhibit 1, we probe whether the decoder exploits the entire relational geometry or merely the target neuron's local neighbourhood by feeding it only the cosine-similarity row corresponding to that neuron.

<p align="center">
  <img src="figures/tgt-sim-only-inputpixels.png" alt="Figure 7.5" width="600"/>
</p>

We can see that, while the decoder can indeed extract useful information solely from the local neighborhood of the target neuron, adding more relations significantly improves performance. This validates our intuition that a richer relational structure helps in disambiguating a representation.


Next, we assess how the size of the relational graph that we provide to the decoder affects the decoding accuracy. To do this, we sample uniformly random subsets of the 784 input neurons and perform the decoding task on the relational structure of subsets of varying sizes.

<p align="center">
  <img src="figures/varying-k-input-pixel-results.png" alt="Figure 7.75" width="600"/>
</p>

We can see that, while performance improves as we increase the size of the relational graph provided, adding more neurons to the input yields diminishing returns at some point. In other words, intentional content can be extracted from neurons even when considering only a subgraph of the relational structure they are embedded in.