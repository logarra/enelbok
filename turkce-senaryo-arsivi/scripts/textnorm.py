import re, unicodedata
def norm(s):
    if isinstance(s, list): s = " ; ".join(map(str, s))
    s = str(s or "").replace("ı", "i").replace("İ", "i")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[ʻʿʾ'’`ʼ]", "", s.lower())
    return s
