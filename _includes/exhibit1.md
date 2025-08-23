# Exhibit 1: MNIST Digit Representations

## Idea
In this experiment we illustrate how artificial neural networks can unambiguously represent inputs by capturing characteristics of the input distribution in their connectivity. For this, we propose the following task: For an unseen network trained to classify MNIST images, we want to deduce the class that a given output neuron encodes, with no guarantee about the order in which the output neurons are given. Moreover, we want to decode the class of a given neuron purely based on the connectivity of the output layer to the previous layer. The idea is that the connectivity of the network allows us to identify a relational structure between the output neurons that reflects characteristics of the MNIST distribution. Within this relational structure, we hypothesize that each MNIST class occupies a unique position relative to the other classes (see [3D visualization](#gram-matrix-3d) for the geometric structure of this relationship). This approach deviates somewhat from the aforementioned idea that ultimately functional networks rather than structural networks ground relational structures responsible for conscious representations. However, the experiment should still be relevant for two reasons: First, we are primarily interested in whether networks that emerge from learning a given input distribution can unambiguously encode information in the first place, regardless of the exact physical implementation of the network. Second, functional networks ultimately emerge from structural networks and the latter should be reflected in the former.

## Machine learning setup
To operationalize this idea, we want to turn it into a machine learning problem: Can we train a decoder that predicts the class of an output neuron purely based on connectivity of the output layer to the previous layer? (Please note that the use of a decoder in this experiment in no way negates our claim from [the previous section](#conscious-content-is-not-determined-by-a-decoder) that a decoder inside the brain cannot account for determined conscious content. Here we want to use a decoder to ascertain the presence of unambiguous representations, but this does not imply that the decoder is necessary for the representations to be unambiguous.) Note that we cannot train the decoder on the same network it should be evaluated on, since that would result in the decoder learning a network-specific mapping of neurons to classes, and not a general principle of aboutness for MNIST. To avoid this, we train many networks using different random seeds on MNIST to generate the training and validation data. Crucially, data from the same network is only contained in either the training or the validation set, but not in both. This way, the only way for the decoder to solve the task is to learn to recognise consistent patterns in connectivity across different networks that are informative about class identity.

## Dataset
To train a decoder to predict which class a given output neuron represents based on the incoming weights to the output layer, we construct an input-output pair (X, y) in the following way: For a given network that was trained on MNIST, let W denote its output layer weights ([decoder pipeline](#decoder-architecture) panel a). We define X as a matrix consisting of a random permutation of the rows of W ([decoder pipeline](#decoder-architecture) panel b). This means that each row of X corresponds to the input weights of one of the output neurons of the underlying network. Moreover, any row of X could be associated with any of the output neurons of the underlying network, and thus with any of the 10 MNIST classes. Finally, we define y as the class index of whichever output neuron ended up being the first row of X. Thus, what the decoder ‘sees’ is a set of weight vectors corresponding to output neurons of the network. The position of these vectors within X contains no information, except that the decoder will have to predict the class index of the one that occupies the first row. To generate a dataset for one type of MNIST-classifying network, we train the underlying network on 1000 different random seeds, resulting in 1000 sets of output layer weights. Since each network has 10 output neurons, this gives us a total of 10,000 data points, one for each output neuron across all trained networks.

## Preprocessing
While the dataset we described above should contain all the information the decoder needs to predict the class of an output neuron by identifying its relations to other output neurons (if this relational structure does indeed exist), in practice we found that the decoder does not naturally learn to identify these relations well (at least not within the limited training time we used to fit the decoder). To point the decoder into the right direction, we applied the following preprocessing step to X.

$$
X_{norm} = \frac{X}{\|X\|_{row}}, \quad\quad  X' = X_{norm} X_{norm}^T
$$

$$
(X')_{i,j} = \frac{X_i \cdot X_j}{\|X_i\| \|X_j\|}
$$

Where $$X_i$$ denotes the i-th row of X, $$\|X\|_{row}$$ denotes row-wise L2 normalization (dividing each row by its L2 norm), and $$\cdot$$ represents the dot product. Like X, the rows of X′ all correspond to one of the output neurons and the first row corresponds to the output neuron whose class index should be predicted by the decoder ([decoder pipeline](#decoder-architecture) panel c). However, instead of representing the incoming weights of an output neuron, a row now represents the cosine similarities between that neuron's incoming weights with all other output neurons' incoming weights. In other words, the value $$(X')_{i,j}$$ represents the cosine similarity between the incoming weights of output neuron i and output neuron j. Note that i and j correspond to the indices within X, which was created from a random permutation of WL. In other words, i and j are not informative of the class indices. However, X′ now encodes the output neurons in terms of their input weights in a much more explicitly relational fashion. In addition to facilitating better decoding accuracy, this has the advantage that the decoder, if successful, identifies classes of output neurons exclusively based on relational information.

## Decoder architecture {#decoder-architecture}
Because the order of the rows of X′ beyond the first row (which always corresponds to the output neuron whose class should be predicted) contains no useful information to solve the task, we want our decoder to be invariant to permutations of the rows of X′. We achieve this using a Transformer-like architecture with self-attention layers [^9], as seen in the decoder architecture pipeline below (panel d). We treat the rows of X′ as tokens, pass the data through two multi-head self-attention layers and finally read out the result from the first token’s learned representation using a linear layer that produces a 10-dimensional output. During training, we compute the cross entropy loss between this output and the label y. To compute the validation accuracy, we simply take the output of the decoder with the highest value as our class prediction for a given data point.


![Decoder architecture pipeline](figures/decoder-architecture-pipeline.png)
_Decoder architecture pipeline: Data processing pipeline from underlying MNIST-trained network to decoder. To simplify the diagrams, we are considering a hypothetical network with only 3 output units. **a:** As a basis for our decoding task we consider the output layer of a fully-connected feedforward network trained to classify MNIST using backpropagation. The connectivity matrix contains the incoming weights for each output neuron in its rows. **b:** To create a data point for the decoder, we permute the rows of the output layer connectivity matrix such that the class identity of an output neuron cannot be determined based on its position in the matrix. The input weights of the output neuron whose class identity should be predicted is in the first row. Hence, in this example, the second element of the target output y is equal to 1 because the original index of the output neuron in the first row of X is equal to 1. **c:** To facilitate extraction of relational information between output neurons, we generate matrix X′ by first normalizing each row of X and then computing $$X' = X_{norm}X_{norm}^T$$. Each element $$(X')_{i,j}$$ represents the cosine similarity between the incoming weights of output neuron i and output neuron j. Note that i and j correspond to the indices after permutation, which means they are not informative about class identity. **d:** The rows of X′ are treated as tokens and fed into a multi-head self-attention (MSA) based decoder network. We pass the data through two MSA layers, after which only the representation of the first token (corresponding to the first row of X′, which in turn corresponds to the output neuron whose class we want to identify) is fed into a fully-connected linear layer (FC) which maps to a 10-dimensional space (corresponding to the 10 MNIST classes). Finally, during training, the cross-entropy loss (L) is computed between the prediction $$\hat{y}$$ and the target value y._


## Results
To evaluate whether the output layers of the underlying MNIST networks encode relational information that allows us to identify the class of output neurons, we train our self-attention based decoder for 250 epochs on 8000 datapoints and validate its accuracy on the remaining 2000. We train the decoder on three different datasets, generated by training fully-connected networks on MNIST in three different training paradigms: no training, normal backpropagation, and backpropagation with dropout. The ’no training’ paradigm serves as a control. Since the underlying network connectivity is random, there should be no relevant relational structure in the output weights, and hence the decoder accuracy should be equivalent to random guessing (i.e. 0.1). The results are shown in the [validation accuracy plot](#decoder-validation-accuracy) below.
We can see that the accuracy of predicting output neuron classes based on their connectivity is above chance level (except for the control dataset of untrained networks, which yields chance-level accuracy as expected). Due to the way we designed our dataset, we can be fairly certain that the decoder achieves this purely based on relational information between output neurons. While training the decoder on the standard MNIST-trained networks (no dropout) yields some correct predictions resulting in a validation accuracy of roughly 25% at the end of training, the final accuracy jumps to about 75% as we switch to the dataset that was produced with dropout. Intuitively we are not surprised that dropout yields higher decoding accuracy, as encourages neurons to rely on population activity rather than single-neuron pathways [^10]. If output neurons rely on population activity of the last hidden layer, output neurons of similar MNIST digits should also have similar input weights, as they should share more features than output neurons representing dissimilar MNIST digits. Notably, while this learned approach establishes the feasibility of relational decoding and will prove essential for more complex tasks like spatial position inference (see Exhibit 2), we later demonstrate that a direct geometric matching approach can achieve even higher accuracies—including perfect 100% accuracy for dropout networks by directly leveraging the consistency of relational geometries across network instances.

![Decoder validation accuracy across training paradigms](figures/decoder-validation-accuracy-training-paradigms.png)
_Decoder validation accuracy across training paradigms: Progression of the validation accuracy during 100 epochs of training the decoder to identify output neuron classes based on an unordered set of weight vectors of output neurons. The error margins reflect the standard deviation across 5 random seeds. We used three different training paradigms to generate the underlying MNIST-trained networks used to generate the data for the decoder: no training, normal backpropagation (FullyConnected), and backpropagation with dropout (FullyConnectedDropout). Note that the 'untrained' flag in the legend refers to the underlying networks used to generate the training data, not the decoder._ {#decoder-validation-accuracy}

To investigate how relational structure complexity affects decoding accuracy, we conducted an ablation study by systematically reducing the number of output neurons available to the decoder. Our results confirm that asymmetric relational structures between output neurons are essential for the decoder to function, as the 2-neuron case performs exactly at random chance level (50%, or 1.0x), since asymmetric relations cannot exist between only two points. While the 5-neuron condition achieves the highest absolute validation accuracy (79.1%), performance relative to random guessing increases consistently with neuron count, with the 10-neuron model performing 7.36x better than random (73.6%). This suggests that as the decoder gains access to more relational structure among output neurons, it becomes increasingly capable of decoding that structure, implying that decoder accuracy should continue to improve with more complex input distributions as the ambiguity of underlying representations decreases.

![Ablation study: neuron count performance](figures/ablation-study-neuron-count-performance.png)
_Ablation study showing neuron count performance: Ablation study examining the impact of neuron count on neural network performance. The top panel compares validation accuracy (purple) to the random guessing baseline (green) for networks with 2-10 output neurons. Error bars represent standard deviation across 5 random seeds for each condition. The bottom panel shows the relative performance gain compared to random guessing. The 2-neuron case achieves only random-level performance (1.0x), validating the hypothesis that asymmetric relational structures in the output layer are necessary for the decoder to function. Performance relative to random chance increases with neuron count, with the 10-neuron model achieving 7.36x better than random performance._

To provide additional context for our results, the [MNIST model validation accuracies plot](#mnist-model-accuracies) below shows the validation accuracies of the underlying MNIST models themselves (not the decoder). This comparison serves as an important sanity check and further highlights a key insight: despite the dropout-trained networks achieving virtually the same MNIST classification accuracy compared to the standard backpropagation networks, they yield dramatically higher decoder accuracies (75% vs 25% as shown in the [decoder validation accuracy plot](#decoder-validation-accuracy) above). This disparity suggests that dropout fundamentally alters how information is represented within the network, creating more distinct relational structures between output neurons while leaving task performance unchanged (the [3D geometric structure](#gram-matrix-3d) visualizes these distinctive relational patterns). The fact that dropout networks are more decodable despite the same task performance suggests that the degree to which representations inside the network are ambiguous is to some extent orthogonal to task performance.

![MNIST model validation accuracies](figures/mnist-model-validation-accuracies.png)
_MNIST model validation accuracies: Validation accuracies of the underlying MNIST models used to generate datasets for the decoder across 10 randomly sampled seeds for each training paradigm._ {#mnist-model-accuracies}

To pinpoint how much of the decoder’s success comes from the whole relational geometry of the output layer, we reran the experiment but supplied the decoder with only the first row of X', the cosine-similarity vector of the target neuron with all other neurons in the output layer, while masking out all pairwise similarities that do not involve the target neuron.

![Target similarity only for output neurons](figures/target-similarity-only-output-neurons.png)

Accuracy plummets when that contextual structure is removed (for both vanilla backprop and dropout). This shows that a single neuron’s local neighbourhood is insufficient to accurately determine its class identity; the decoder takes into account how the rest of the output population is organised to disambiguate which digit the target neuron represents.

To gauge how architecture-invariant our decoder really is, we check whether it can maintain high classification accuracy when the base network’s layout changes. The following figure summarizes the result for an unseen target architecture, [100]: a decoder trained only on [50, 50] already transfers above chance, while a decoder trained on networks whose layer width m is randomly sampled between 25 and 100 climbs almost to the self-transfer “oracle,” demonstrating near-architecture-independent generalisation.

<p align="center">
  <img src="figures/architecture-transfer-evaluation.png" alt="Architecture Transfer Figure" width="600"/>
</p>

## Hyperparameters
In the following we list all hyperparameters that were chosen for the underlying networks to generate the dataset (Table 1), and for the self-attention based decoder (Table 2). Note that none of these hyperparameters were optimized using gridsearch or similar schemes, most of them were chosen quite arbitrarily, since this is only supposed to be a proof of concept.

<br />

| Name                                                   | Value |
|--------------------------------------------------------|-------|
| learning rate                                          | 0.001 |
| batch size                                             | 256   |
| epochs (except for the non-train paradigm)             | 2     |
| hidden dimensionalities                                | 50, 50|
| dropout rate (only for the dropout paradigm)           | 0.2   |

_Table 1: Hyperparameters for underlying, MNIST-trained networks used to generate the training and validation data for the decoder. Note that the number of epochs in the ’untrained’ paradigm was set to 0, and the dropout rate only applies to the ’dropout’ paradigm._

<br />
<br />

| Name                                                 | Value |
|------------------------------------------------------|-------|
| learning rate                                        | 0.001 |
| batch size                                           | 64    |
| epochs (except for the non-train paradigm)           | 100   |
| hidden dimensionality                                | 64    |
| number of attention heads per MSA layer              | 4     |
| number of MSA layers                                 | 2     |

_Table 2: Hyperparameters for decoder. MSA is short for multi-head self-attention_

## Alternative Approach: Gram Matrix Matching

Having established that learned decoders can successfully extract relational structure from neural network connectivity, we investigated whether the geometric structure itself is sufficiently distinctive and consistent across networks to enable direct matching without requiring a trained decoder.

This method constructs a reference Gram matrix by averaging the cosine similarity matrices from several reference networks trained on MNIST. For each validation network, we then evaluate all possible permutations of its output neurons to find which ordering produces a Gram matrix closest to the reference geometry using Frobenius distance. If relational representations are truly unambiguous and consistent across network instances, the correct class ordering should yield the best match to the reference geometry.

| Model           | Accuracy | Std Dev |
|-----------------|----------|---------|
| untrained       | 0.100    | 0.155   |
| no_dropout      | 0.383    | 0.441   |
| dropout         | 1.000    | 0.000   |

_Gram matrix decoding accuracies across training paradigms using 5 reference networks and 10 validation networks._

The results validate this hypothesis. This geometric approach achieves remarkably higher accuracies than the self-attention decoder, reaching perfect 100% accuracy for dropout-trained networks while requiring significantly fewer reference networks (5 vs 800 networks). The untrained networks perform at chance level as expected, while standard backpropagation networks achieve 38.3% accuracy. The dropout condition achieves perfect decoding with zero variance, showing that dropout creates consistent and distinctive relational geometries between output neurons across different network instances.

Similar to our earlier ablation study with the self-attention decoder, we investigated how the number of output neurons affects the Gram matrix matching approach:

![Gram matrix neuron ablation](figures/gram_neuron_ablation_plot.png)
_Gram matrix decoding performance vs. number of neurons: Ablation study showing how Gram matrix matching accuracy varies with the number of output neurons available for decoding._

![Permutation distances for no dropout](figures/perm_distances_no_dropout.png)
_Permutation distance distributions for networks trained without dropout: The true permutation (red dot) shows only a small margin over incorrect permutations._

![Permutation distances for dropout](figures/perm_distances_dropout.png)
_Permutation distance distributions for networks trained with dropout: The true permutation shows a substantial gap from all incorrect alternatives._

These distance distributions reveal why dropout achieves perfect accuracy while vanilla backpropagation struggles. For networks without dropout, the true permutation (red dot) has only a tiny margin over incorrect permutations, making it easily confused with alternatives. In contrast, dropout networks show a substantial gap between the correct permutation and all others, creating an unambiguous geometric signature that reliably identifies the true class ordering. This geometric clarity explains why both our learned decoder approach (75% accuracy) and direct matching approach (100% accuracy) achieve their best performance on dropout networks—the underlying relational structure is fundamentally more distinctive and consistent.

To evaluate the architecture-invariance of the gram matrix approach, we tested cross-architecture transfer by using reference networks of one architecture to decode test networks of different architectures. The heatmap below shows decoding accuracy when transferring between different network architectures, with each cell representing accuracy when using reference networks of one architecture (y-axis) to decode test networks of another architecture (x-axis). The strong diagonal and near-diagonal performance demonstrates that the gram matrix approach maintains high accuracy across different network architectures, confirming that the relational geometric structure is largely architecture-invariant.

<p align="center">
  <img src="figures/cross_architecture_heatmap_accuracy.png" alt="Cross Architecture Heatmap Accuracy" width="600"/>
</p>

## 3D Embedding of Reference Gram Matrix {#gram-matrix-3d}

To further visualize the relational structure that enables perfect decoding in dropout networks, we performed eigendecomposition on the reference Gram matrix and embedded the 10 neuron positions into 3D space using the top 3 eigenvectors, scaled by their corresponding eigenvalues. The connecting edges highlight nearest-neighbor relationships.

<iframe src="assets/gram_matrix_3d_dropout.html" 
        width="100%" 
        height="600" 
        frameborder="0" 
        style="border: none;">
</iframe>

## Dataset identity from final-layer weights
Using the same self-attention decoder and random output-neuron permutations, we classify whether a network was trained on MNIST or Fashion-MNIST from the final-layer weights alone. Performance is near-perfect for Dropout models (0.998 ± 0.001 STD) and clearly above chance for No Dropout (0.843 ± 0.008 STD). This indicates that the relational geometry of the output weights carries a dataset-specific signature, amplified by dropout.

<p align="center">
  <img src="/figures/dataset-classification-accuracy.png" alt="Dataset classification from final-layer weights" style="max-width:560px;width:100%;">
</p>


## Discussion
We demonstrated that networks trained on MNIST encode class identity of output neurons relationally in their output weights. The learned decoder achieved 75% accuracy, while geometric matching reached 100% accuracy for dropout networks. Training paradigm affects the strength of relational encoding, with dropout producing more distinctive geometries.

Perfect decoding accuracy indicates $$H(I \vert R) = 0$$: complete determination of representational content by relational structure. Our experiments formally measure $$H(I \vert R,C)$$ where C represents context. In our experiments, C includes the neural network domain (as opposed to other systems), the datasets used, network architectures, the constraint that we decode class identity rather than other representational content, and probably much more. While this conditioning on C might seem to impose significant limitations, there are reasons to believe these reflect practical rather than fundamental constraints on relational decoding approaches.

The dataset classification results demonstrate that key components of C can be inferred from R itself. We achieve near-perfect accuracy (0.998) distinguishing MNIST from Fashion-MNIST networks based solely on relational structure, showing that task domain—a major component of C—is actually encoded in R. This suggests that the distinction between I (content to be decoded) and C (context) is somewhat artificial and arises only because our decoder operates in a limited domain. C could be viewed as part of I that we simply choose not to decode in our experimental setup. The results point toward the possibility of approaching true $$H(I \vert R)$$ rather than just $$H(I \vert R,C)$$—a universal decoder trained on relational structures in larger, multi-modal neural networks could potentially eliminate the need for explicit context conditioning, requiring at most a very broad context consisting of our part of the universe and choice of modalities. Additionally, cross-architecture transfer results suggest that network architecture might not be a crucial component of the context.

These results demonstrate a practical approach for operationalizing the ambiguity measure $$H(I \vert R)$$ in neural representations. Higher decoding accuracy corresponds to lower conditional entropy (given some assumptions), providing a quantitative framework for measuring representational ambiguity. The perfect geometric matching results for dropout networks show that relational geometry alone can unambiguously specify representational content in a given context, suggesting that neural networks can achieve the low-ambiguity representations that theoretical accounts of consciousness require. This methodology extends naturally to other representational domains, as demonstrated in Exhibit 2 with spatial position decoding, offering a path toward both empirically measuring the ambiguity of representations and directly decoding their content across different neural systems.

