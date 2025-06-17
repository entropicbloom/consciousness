We showed that a decoder can be trained to recover representational content by looking at a set of relations between neurons. The metrics we obtained in the experiments are: accuracy for output neuron class identity, and R2 score for input neuron distance from center. To link this more directly to the concept of _ambiguity_, we want to come back to the idea discussed in [Defining ambiguity](#defining-ambiguity).

We defined representational ambiguity as $$H(I \vert R)$$: the entropy over all possible interpretations that remain once the representation $$R$$ is fixed. Empirically, however, we never wield a "God's eye" universal decoder. Every decoder we train is built for a specific task context. For instance "these ten labels are the MNIST digits" or "the target is the distance of a pixel from image centre."  We denote this context by $$C$$.

Because $$C$$ is already baked into the trained decoder, the quantity we can bound in experiments is

$$
H(I \vert R, C)
$$

the entropy that remains given both the relational structure encoded in R and the contextual constraint that interpretations must come from the known label set defined by C. By translating decoding performance into an upper bound on $$H(I \vert R, C)$$ we obtain a lower bound on how much ambiguity the training process has eliminated within that context. This shifts the theory-experiment link from $$H(I \vert R)$$ to $$H(I \vert R, C)$$ but preserves the central idea: less ambiguous representations are those that admit fewer alternative interpretations even when the task is specified.


## Ambiguity-Reduction Score (ARS)

We define  

$$
\mathrm{ARS}=1-\frac{H(I \vert R,C)}{H_{\max}}
$$

where $$H(I \vert R,C)$$ is the conditional entropy of interpretations $$I$$ given a representation $$R$$ under the same context $$C$$ as the task, and $$H_{\max}$$ is the entropy of a completely ambiguous representation ($$\log_{2}K$$ for $$K$$ classes; $$h(Y)$$ for a continuous target $$Y$$).

*ARS ≈ 0* means the representation is maximally ambiguous;  
*ARS ≈ 1* means it is fully unambiguous.

## Lower-bound from accuracy (classification)

Fano's inequality links top-1 accuracy $$A$$ to entropy:

$$
H(I \vert R,C)\leq h_{b}(1-A)+(1-A)\log_{2}(K-1)
$$

where $$h_b(p)$$ is the binary entropy function $$h_b(p) = -p\log_2(p) - (1-p)\log_2(1-p)$$, which measures the uncertainty of a binary random variable with probability $$p$$. This yields the bound we report.

$$
\boxed{
\mathrm{ARS}
  \geq 1-\frac{h_{b}(1-A)+(1-A)\log_{2}(K-1)}{\log_{2}K}}
\qquad(K=10\text{ for MNIST})
$$

Note: Since the bound relies only on top-1 accuracy, treating every mistake as if any of the other K-1 classes could be correct, it overestimates residual ambiguity, so the reported ARS values are conservative lower bounds.


## Lower-bound from R2 (regression)

Assuming Gaussian residuals and standardizing the target so $$\mathrm{Var}(Y)=1$$,

$$
H(Y\vert R,C)\leq\tfrac12\log_{2}(2\pi e\,(1-R^{2}))
$$

which leads to

$$
\boxed{
\mathrm{ARS} \geq \dfrac{\log_{2}[1/(1-R^{2})]}{\log_{2}(2\pi e)}
           }\approx\frac{\log_{2}[1/(1-R^{2})]}{4.094}
$$

## Results

### Exhibit 1 - Class-ID decoding

| Training paradigm | Accuracy (mean ± SD)      | ARS (lower bound, mean ± SD)      |
|-------------------|---------------------------|-----------------------------------|
| Dropout           | 0.743 ± 0.011             | 0.507 ± 0.015                     |
| No Dropout        | 0.238 ± 0.009             | 0.035 ± 0.004                     |
| Untrained         | 0.094 ± 0.007             | 0.000 ± 0.000                     |



### Exhibit 2 - Pixel-distance regression

| Training paradigm | $$R^{2}$$                 | ARS (lower bound)                 |
|-------------------|---------------------------|-----------------------------------|
| Dropout           | 0.695                     | 0.419                             |
| No Dropout        | 0.844                     | 0.654                             |
| Untrained         | −0.008                    | 0.000                             |

In both paradigms, the decoder is able to reduce the ambiguity of what the representations could be about by at least 50% when looking at the relational patterns in neurons, given the context of the task.


