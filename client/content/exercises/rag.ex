@exercise rag-bm25
lesson: retrieval-ranking
title: BM25 scoring
--- prompt
Implement `bm25_scores(query, docs, k1=1.5, b=0.75)` where `query` is a list of terms and `docs` is a list of documents, each a list of terms. Return one score per document using

$$\sum_{q}\text{IDF}(q)\,\frac{f(q,D)(k_1+1)}{f(q,D)+k_1\left(1-b+b\frac{|D|}{\text{avgdl}}\right)},\qquad \text{IDF}(q)=\ln\!\Big(\frac{N-n_q+0.5}{n_q+0.5}+1\Big)$$
--- starter
import math

def bm25_scores(query, docs, k1=1.5, b=0.75):
    N = len(docs)
    avgdl = sum(len(d) for d in docs) / N
    raise NotImplementedError
--- solution
import math

def bm25_scores(query, docs, k1=1.5, b=0.75):
    N = len(docs)
    avgdl = sum(len(d) for d in docs) / N
    scores = []
    for d in docs:
        s = 0.0
        for q in query:
            n_q = sum(1 for doc in docs if q in doc)
            idf = math.log((N - n_q + 0.5) / (n_q + 0.5) + 1)
            f = d.count(q)
            s += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * len(d) / avgdl))
        scores.append(s)
    return scores
--- tests
docs = [["sleepy", "cats", "nap"], ["stocks", "fell", "today"], ["cats", "chase", "cats", "mice"]]
s = bm25_scores(["cats"], docs)
assert s[1] == 0.0, "a document without the term scores 0"
assert s[2] > s[0] > 0, "more occurrences of the term should score higher (with saturation)"
s2 = bm25_scores(["stocks"], docs)
assert s2.index(max(s2)) == 1, "the only document about stocks should win"
assert bm25_scores(["missing"], docs) == [0.0, 0.0, 0.0], "a term in no document gives zeros"

@exercise rag-rrf
lesson: retrieval-ranking
title: Reciprocal Rank Fusion
--- prompt
Write `rrf(rankings, k=60)` where `rankings` is a list of ranked lists of document IDs (best first). Each document's fused score is \(\sum_r 1/(k+\text{rank}_r)\) with ranks starting at 1, summed over the lists that contain it. Return document IDs sorted by fused score, highest first (break ties by ID).
--- starter
def rrf(rankings, k=60):
    raise NotImplementedError
--- solution
def rrf(rankings, k=60):
    scores = {}
    for ranking in rankings:
        for r, doc in enumerate(ranking, start=1):
            scores[doc] = scores.get(doc, 0.0) + 1.0 / (k + r)
    return sorted(scores, key=lambda d: (-scores[d], d))
--- tests
assert rrf([["a", "b", "c"], ["a", "b", "c"]]) == ["a", "b", "c"], "identical rankings keep their order"
assert rrf([["a", "b"], ["b", "c"]])[0] == "b", "a document ranked well by both lists should win"
assert set(rrf([["x"], ["y"]])) == {"x", "y"}, "documents from every list are included"

@exercise rag-metrics
lesson: rag-eval
title: Recall@k and MRR
--- prompt
Write `recall_at_k(results, relevant, k)` for one query (a ranked list of IDs and a set of relevant IDs) and `mrr(all_results, all_relevant)` averaged over queries, where a query with no relevant result contributes 0.
--- starter
def recall_at_k(results, relevant, k):
    raise NotImplementedError

def mrr(all_results, all_relevant):
    raise NotImplementedError
--- solution
def recall_at_k(results, relevant, k):
    return len(set(results[:k]) & set(relevant)) / len(relevant)

def mrr(all_results, all_relevant):
    total = 0.0
    for res, rel in zip(all_results, all_relevant):
        for i, d in enumerate(res):
            if d in rel:
                total += 1 / (i + 1)
                break
    return total / len(all_results)
--- tests
import math
assert recall_at_k(["a", "b", "c", "d"], {"a", "d", "z", "y"}, 3) == 0.25, "only 'a' of 4 relevant docs is in the top 3"
assert recall_at_k(["a", "b"], {"a", "b"}, 10) == 1.0, "k larger than the list is fine"
assert math.isclose(mrr([["x", "a"], ["a"], ["q", "w", "e", "a"]], [{"a"}, {"a"}, {"a"}]), (1 / 2 + 1 + 1 / 4) / 3), "ranks 2, 1 and 4"
assert mrr([["x"]], [{"a"}]) == 0.0, "no relevant result contributes 0"
