#!/usr/bin/env python3
"""curated.jsonl içindeki her öğe için tam metadata + dosya listesi çeker -> data/meta.jsonl"""
import json, pathlib, sys, time
from concurrent.futures import ThreadPoolExecutor
import internetarchive as ia
D = pathlib.Path(__file__).resolve().parent.parent / "data"
def get(idf):
    for a in range(4):
        try:
            it = ia.get_item(idf)
            files = [{"name": f.get("name"), "format": f.get("format"), "size": f.get("size")} for f in it.files]
            return {"identifier": idf, "metadata": it.metadata, "files": files, "is_dark": it.is_dark}
        except Exception as e:
            time.sleep(3 * (a + 1)); err = str(e)
    return {"identifier": idf, "error": err}
ids = [json.loads(l)["identifier"] for l in open(D/"curated.jsonl", encoding="utf-8")]
with ThreadPoolExecutor(6) as ex:
    res = list(ex.map(get, ids))
with open(D/"meta.jsonl", "w", encoding="utf-8") as f:
    for r in res: f.write(json.dumps(r, ensure_ascii=False)+"\n")
print(len(res), sum("error" in r for r in res), "hata", file=sys.stderr)
