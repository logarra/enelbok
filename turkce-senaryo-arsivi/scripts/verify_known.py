#!/usr/bin/env python3
"""ia_known_hits.jsonl içindeki gürültüyü yazar/başlık eşleşmesiyle ayıklar -> data/ia_known_verified.jsonl"""
import json, re, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
D = pathlib.Path(__file__).resolve().parent.parent / "data"
from textnorm import norm
GENERIC = {"Karagöz","Ortaoyunu","Tuluat"}
keep = []
for l in open(D/"ia_known_hits.jsonl", encoding="utf-8"):
    it = json.loads(l); k = it["_known"]
    blob = norm(" ".join(str(it.get(f) or "") for f in ("title","creator","description")))
    title = norm(it.get("title"))
    ph = norm(k["phrase"]); au = norm(k["author_hint"])
    au_tokens = [t for t in re.split(r"\W+", au) if len(t) > 3]
    # Osmanlıca transliterasyonlarda harf düşmesi olur (Namk Kemal) -> esnek eşleşme
    au_ok = any(t in blob or t.replace("i","") in blob.replace("i","") for t in au_tokens)
    ph_ok = ph in title or ph.replace(" ","") in title.replace(" ","")
    if k["author_hint"] in GENERIC:
        ok = ph_ok
    else:
        ok = ph_ok and au_ok
    if ok: keep.append(it)
with open(D/"ia_known_verified.jsonl","w",encoding="utf-8") as f:
    for it in keep: f.write(json.dumps(it, ensure_ascii=False)+"\n")
print(len(keep), file=sys.stderr)
for it in keep:
    print(it["_known"]["phrase"],"||",it["identifier"],"|",str(it.get("title"))[:60],"|",str(it.get("creator"))[:30],"|",it.get("date","")[:4])
