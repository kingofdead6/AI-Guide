@exercise nlp-bpe
lesson: tokenization
title: One merge of byte-pair encoding
--- prompt
The vocabulary maps each word, written as a tuple of symbols, to its frequency, e.g. `{("l","o","w","</w>"): 5}`. Write:

- `pair_counts(vocab)`: a dict mapping each adjacent symbol pair to its total frequency.
- `merge(vocab, pair)`: a new vocabulary where every occurrence of `pair` inside a word is replaced by the joined symbol.
--- starter
from collections import Counter

def pair_counts(vocab):
    raise NotImplementedError

def merge(vocab, pair):
    raise NotImplementedError
--- solution
from collections import Counter

def pair_counts(vocab):
    c = Counter()
    for word, f in vocab.items():
        for a, b in zip(word, word[1:]):
            c[(a, b)] += f
    return dict(c)

def merge(vocab, pair):
    out = {}
    for word, f in vocab.items():
        new, i = [], 0
        while i < len(word):
            if i < len(word) - 1 and (word[i], word[i + 1]) == pair:
                new.append(word[i] + word[i + 1]); i += 2
            else:
                new.append(word[i]); i += 1
        out[tuple(new)] = out.get(tuple(new), 0) + f
    return out
--- tests
vocab = {("l", "o", "w", "</w>"): 5, ("l", "o", "w", "e", "r", "</w>"): 2, ("n", "e", "w", "</w>"): 6}
pc = pair_counts(vocab)
assert pc[("l", "o")] == 7, f"('l','o') appears 5 + 2 = 7 times, got {pc.get(('l', 'o'))}"
assert pc[("w", "</w>")] == 11, "('w','</w>') appears in 'low' and 'new': 5 + 6"
best = max(pc, key=pc.get)
assert best == ("w", "</w>"), f"the most frequent pair should be ('w', '</w>'), got {best}"
m = merge(vocab, ("l", "o"))
assert ("lo", "w", "</w>") in m and m[("lo", "w", "</w>")] == 5, "'l','o' should merge into 'lo'"
assert ("n", "e", "w", "</w>") in m, "words without the pair are unchanged"

@exercise nlp-arabic-normalize
lesson: arabic-nlp
title: Normalize Arabic text for search
--- prompt
Write `normalize(text)` that removes Arabic diacritics (characters U+064B to U+0652) and the tatweel (U+0640), maps the alef variants أ إ آ to ا, maps ى to ي and ة to ه, and collapses runs of whitespace into single spaces (trimmed at the ends).
--- starter
import re

def normalize(text):
    raise NotImplementedError
--- solution
import re

def normalize(text):
    text = re.sub("[ً-ْـ]", "", text)
    text = re.sub("[أإآ]", "ا", text)
    text = text.replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"\s+", " ", text).strip()
--- tests
assert normalize("مَكْتَبَة") == "مكتبه", "diacritics removed and ta marbuta mapped to ha"
assert normalize("جميلـــة") == "جميله", "tatweel removed"
assert normalize("إلى") == "الي", "hamza alef and alef maqsura normalized"
assert normalize("  السلام    عليكم ") == "السلام عليكم", "whitespace collapsed and trimmed"
