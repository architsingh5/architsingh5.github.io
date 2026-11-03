"""Fetch public LeetCode stats and write data/leetcode.json.

Run by .github/workflows/leetcode.yml once a week. Uses only the standard library.
Exits non-zero (leaving the existing file untouched) if LeetCode returns anything unexpected.
"""
import datetime
import json
import os
import sys
import urllib.request

USERNAME = os.environ.get("LEETCODE_USERNAME", "architsingh5")
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "leetcode.json")

QUERY = """
query stats($u: String!) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $u) {
    profile { ranking }
    badges { id }
    submitStatsGlobal {
      acSubmissionNum { difficulty count submissions }
      totalSubmissionNum { difficulty count submissions }
    }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
}
"""


def fetch(username):
    req = urllib.request.Request(
        "https://leetcode.com/graphql",
        data=json.dumps({"query": QUERY, "variables": {"u": username}}).encode(),
        headers={
            "Content-Type": "application/json",
            "Referer": f"https://leetcode.com/u/{username}/",
            "User-Agent": "portfolio-stats-updater",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def build(raw, username, today):
    data = raw.get("data") or {}
    user = data.get("matchedUser")
    if not user:
        raise ValueError(f"no LeetCode user {username!r}: {raw.get('errors')}")

    ac = {x["difficulty"]: x for x in user["submitStatsGlobal"]["acSubmissionNum"]}
    tot = {x["difficulty"]: x for x in user["submitStatsGlobal"]["totalSubmissionNum"]}
    available = {x["difficulty"]: x["count"] for x in data["allQuestionsCount"]}

    acceptance = None
    if tot.get("All", {}).get("submissions"):
        acceptance = round(100 * ac["All"]["submissions"] / tot["All"]["submissions"], 1)

    tags = {}
    for level in ("advanced", "intermediate", "fundamental"):
        for t in user["tagProblemCounts"].get(level) or []:
            tags[t["tagName"]] = max(tags.get(t["tagName"], 0), t["problemsSolved"])

    langs = sorted(user["languageProblemCount"], key=lambda x: -x["problemsSolved"])

    return {
        "username": username,
        "updated": today,
        "solved": ac["All"]["count"],
        "acceptance": acceptance,
        "ranking": user["profile"]["ranking"],
        "badges": len(user.get("badges") or []),
        "difficulty": [
            {"name": d, "solved": ac[d]["count"], "total": available[d]}
            for d in ("Easy", "Medium", "Hard")
        ],
        "languages": [{"name": x["languageName"], "solved": x["problemsSolved"]} for x in langs[:4]],
        "topics": [
            {"name": k, "solved": v}
            for k, v in sorted(tags.items(), key=lambda kv: (-kv[1], kv[0]))[:9]
        ],
    }


def main():
    out = build(fetch(USERNAME), USERNAME, datetime.date.today().isoformat())
    if out["solved"] <= 0:
        sys.exit("refusing to write: 0 problems solved looks like a bad response")

    # Only rewrite (and so only commit) when the stats changed, not just the date.
    try:
        with open(OUT) as f:
            old = json.load(f)
        if {**old, "updated": None} == {**out, "updated": None}:
            print("no change")
            return
    except FileNotFoundError:
        pass

    with open(OUT, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    print(f"wrote {OUT}: {out['solved']} solved, rank {out['ranking']}")


if __name__ == "__main__":
    main()
