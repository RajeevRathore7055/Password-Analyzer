"""
password_service.py — Strength analysis (Module 1) + Context tips (Security Tips page).
"""
import re
import math

COMMON_PATTERNS = [
    "password","123456","qwerty","abc123","letmein","monkey","dragon",
    "master","iloveyou","welcome","admin","login","sunshine","princess",
    "superman","111111","football","shadow","12345678","pass","test",
    "123456789","1234567890","qwerty123","passw0rd","pa$$word",
]

# Expanded keyboard walks — rows, columns, diagonals
KEYBOARD_WALKS = [
    "qwerty","qwertyuiop","asdfg","asdfghjkl","zxcvb","zxcvbnm",
    "12345","123456","1234567","12345678","123456789","1234567890",
    "67890","qwert","asdfgh","zxcvbn","qazwsx","wsxedc","edcrfv",
    "rfvtgb","tgbyhn","yhnujm","qazwsxedc","!@#$%","!@#$%^&*",
    "abcdef","abcdefg","abcdefgh",
]

# Expanded name/dictionary word list
DICTIONARY_WORDS = [
    "john","love","india","mike","alex","anna","james","sarah","david",
    "summer","winter","spring","autumn","flower","tiger","lion","dragon",
    "hello","world","secret","hockey","baseball","batman","superman",
    "spiderman","ironman","letmein","trustno1","monkey","shadow","master",
    "pass","test","temp","root","admin","guest","default","changeme",
    "sunshine","princess","football","baseball","soccer","jordan","harley",
    "ranger","hunter","george","thomas","andrew","robert","william",
    "jessica","jennifer","michael","charlie","thomas","jessica","pepper",
]

LEET_MAP = {"a": "@", "e": "3", "i": "1", "o": "0", "s": "$", "t": "7", "l": "1"}

SIMPLE_NAMES = [
    "ram","raj","dev","anu","priya","rohit","amit","ravi","neha","pooja",
    "deepak","rahul","sonia","kavya","arjun","ankit","isha","riya","vivek",
    "manish","suresh","dinesh","ramesh","mahesh","ganesh","rakesh","naresh",
    "mukesh","yogesh","lokesh","rajesh","hitesh","ritesh","nitesh","mitesh",
]


def calc_entropy(password: str) -> float:
    pool = 0
    if re.search(r"[a-z]", password): pool += 26
    if re.search(r"[A-Z]", password): pool += 26
    if re.search(r"[0-9]", password): pool += 10
    if re.search(r"[^a-zA-Z0-9]", password): pool += 32
    if pool == 0 or len(password) == 0: return 0.0
    return round(len(password) * math.log2(pool), 2)


def calc_uniqueness(password: str) -> int:
    """Return % of unique characters (0-100)."""
    if not password: return 0
    return round(len(set(password)) / len(password) * 100)


def crack_time_str(entropy: float) -> str:
    if entropy <= 0: return "Instant"
    s = (2 ** entropy) / 1e10
    if s < 1:            return "Instant"
    if s < 60:           return f"~{int(s)} seconds"
    if s < 3_600:        return f"~{int(s/60)} minutes"
    if s < 86_400:       return f"~{int(s/3_600)} hours"
    if s < 2_592_000:    return f"~{int(s/86_400)} days"
    if s < 31_536_000:   return f"~{int(s/2_592_000)} months"
    if s < 3_153_600_000:return f"~{int(s/31_536_000)} years"
    return "Centuries+"


def rule_based_score(password: str) -> dict:
    score, checks, feedback = 0, {}, []

    checks["min_length"]   = len(password) >= 8
    checks["good_length"]  = len(password) >= 12
    checks["great_length"] = len(password) >= 16
    if checks["min_length"]:  score += 15
    else: feedback.append("Use at least 8 characters")
    if checks["good_length"]: score += 15
    else: feedback.append("Use 12+ characters for better security")
    if checks["great_length"]: score += 10

    checks["has_upper"]  = bool(re.search(r"[A-Z]", password))
    checks["has_lower"]  = bool(re.search(r"[a-z]", password))
    checks["has_digit"]  = bool(re.search(r"[0-9]", password))
    checks["has_symbol"] = bool(re.search(r"[^a-zA-Z0-9]", password))
    if checks["has_upper"]:  score += 10
    else: feedback.append("Add uppercase letters (A-Z)")
    if checks["has_lower"]:  score += 10
    else: feedback.append("Add lowercase letters (a-z)")
    if checks["has_digit"]:  score += 10
    else: feedback.append("Add numbers (0-9)")
    if checks["has_symbol"]: score += 15
    else: feedback.append("Add special characters (!@#$%^&*)")

    checks["no_repeat"] = not bool(re.search(r"(.)\1{2,}", password))
    if not checks["no_repeat"]:
        score -= 10
        feedback.append("Avoid repeating characters (aaa, 111)")

    checks["no_common"] = not any(p in password.lower() for p in COMMON_PATTERNS)
    if not checks["no_common"]:
        score -= 20
        feedback.append("Avoid common password patterns")

    score = max(0, min(100, score))
    label = "Weak" if score <= 39 else ("Medium" if score <= 69 else "Strong")
    ent   = calc_entropy(password)

    return {
        "score":      score,
        "label":      label,
        "checks":     checks,
        "feedback":   feedback,
        "entropy":    ent,
        "crack_time": crack_time_str(ent),
        "uniqueness": calc_uniqueness(password),
    }


def _detect_problem(password: str) -> tuple:
    """Returns (problem_type, matched_pattern)."""
    pw = password.lower()
    # Check keyboard walks first (most specific)
    for k in KEYBOARD_WALKS:
        if k in pw: return "keyboard_walk", k
    # Simple Indian/common names
    for n in SIMPLE_NAMES:
        if n in pw: return "simple_name", n
    # Dictionary words
    for w in DICTIONARY_WORDS:
        if w in pw: return "dictionary_word", w
    if re.search(r"(.)\1{2,}", password): return "repeating_chars", None
    if any(p in pw for p in COMMON_PATTERNS): return "common_password", None
    if len(password) < 8:  return "too_short", None
    if len(password) < 12: return "slightly_short", None
    if not re.search(r"[A-Z]", password): return "no_uppercase", None
    if not re.search(r"[^a-zA-Z0-9]", password): return "no_symbols", None
    return "looks_ok", None


def generate_context_tips(password: str, rule_result: dict) -> dict:
    pw_lower     = password.lower()
    context_tips = []
    extra_tips   = []
    sub_example  = None
    problem, matched = _detect_problem(password)

    if problem == "keyboard_walk":
        context_tips += [
            f"Keyboard pattern '{matched}' detected — hackers try these combinations first",
            "Key sequences (qwerty, 12345, asdfg) are in every cracking wordlist",
            "Replace with characters from different, non-adjacent keyboard regions",
        ]
    elif problem == "simple_name":
        subst = "".join(LEET_MAP.get(c, c) for c in matched)
        sub_example = f"'{matched}' → '{subst}' (leet substitution)"
        context_tips += [
            f"Simple name '{matched}' detected — easily guessable by attackers",
            f"Try leet substitution: {sub_example}",
            "Better: replace with a random phrase or use the Passphrase generator",
        ]
    elif problem == "dictionary_word":
        subst = "".join(LEET_MAP.get(c, c) for c in matched)
        sub_example = f"'{matched}' → '{subst}' (leet substitution)"
        context_tips += [
            f"Dictionary word '{matched}' found — first thing hackers try",
            f"Try leet substitution: {sub_example}",
            "Better: replace the word entirely with a random passphrase",
        ]
    elif problem == "repeating_chars":
        context_tips += [
            "Repeating characters (aaa, 111) add zero additional entropy",
            "Each repeated character collapses your effective charset",
            "Replace repeated segments with varied characters and symbols",
        ]
    elif problem == "common_password":
        context_tips += [
            "One of the most commonly breached passwords worldwide",
            "Cracked in under 1 second using prebuilt lookup tables",
            "Use the Generator for a truly random cryptographic replacement",
        ]
    elif problem == "too_short":
        needed = 8 - len(password)
        context_tips += [
            f"Only {len(password)} characters — add {needed} more to reach minimum",
            f"Current entropy: {rule_result['entropy']} bits — target 60+ bits",
            "Each extra character multiplies crack time exponentially",
        ]
    elif problem == "slightly_short":
        extra_e = round((12 - len(password)) * math.log2(95), 1)
        context_tips += [
            f"At {len(password)} characters it's fair — 12+ is the modern standard",
            f"Adding {12-len(password)} more chars adds ~{extra_e} bits of entropy",
            "Target 16+ characters for sensitive accounts (banking, email)",
        ]
    elif problem == "no_uppercase":
        context_tips += [
            "No uppercase letters — missing an entire character class",
            "Adding uppercase expands charset from 36 to 62",
            "Avoid predictable patterns like capitalising only the first letter",
        ]
    elif problem == "no_symbols":
        context_tips += [
            "No special characters — charset limited to 62",
            "Symbols expand charset to 95 — ~53% more combinations per position",
            "Place symbols mid-password, not just at the end",
        ]
    else:
        context_tips += [
            "Password passes all basic checks",
            "For sensitive accounts, target 16+ characters",
            "Try the Passphrase page — equally strong, far easier to remember",
        ]

    if len(password) < 12:
        extra_tips.append("Too short — target 14+ characters for strong security")
    if re.search(r"(.)\1{2,}", password):
        extra_tips.append("Repeating characters detected — vary your characters")
    if any(k in pw_lower for k in KEYBOARD_WALKS):
        extra_tips.append("Keyboard patterns detected — top priority in attack wordlists")
    if not re.search(r"[^a-zA-Z0-9]", password):
        extra_tips.append("No symbols: adding them raises charset from 62 to 95")
    if re.search(r"^[A-Z][a-z]+\d+$", password):
        extra_tips.append("'Capitalised word + number' pattern is extremely predictable")
    if re.search(r"\d{4}$", password):
        extra_tips.append("Ends in 4 digits — often a birth year; avoid predictable suffixes")

    extra_tips = [t for t in extra_tips if t not in context_tips][:3]

    return {
        "problem_type":        problem,
        "context_tips":        context_tips,
        "extra_tips":          extra_tips,
        "substitution_example": sub_example,
    }


def get_education_content() -> dict:
    return {
        "crack_time_examples": [
            {"password": "john123",       "time": "< 0.001 seconds",
             "reason": "Dictionary word + simple number suffix", "color": "red"},
            {"password": "P@ssw0rd",      "time": "~ 3 hours",
             "reason": "Common pattern with leet substitutions", "color": "orange"},
            {"password": "Tr0ub4dor&3",   "time": "~ 550 years",
             "reason": "Mixed types, decent length, no common patterns", "color": "yellow"},
            {"password": "@R$ha8#xst!1Kp","time": "Centuries+",
             "reason": "14 chars, all types, ~92 bits entropy", "color": "green"},
        ],
        "reuse_risk": {
            "title":   "Password Reuse = ALL Accounts at Risk",
            "message": "If you reuse a password and ONE site is breached, attackers try your credentials everywhere automatically. One breach = all accounts compromised.",
            "stat": "81% of breaches involve weak or reused passwords (Verizon DBIR)",
        },
        "two_factor": {
            "title":   "What is 2FA and Why It Matters",
            "message": "2FA adds a second layer — even if your password is stolen, the attacker cannot log in without your phone or hardware key. 2FA blocks 99.9% of automated attacks.",
            "types": [
                "SMS Code (convenient, weakest)",
                "Authenticator App — Google Auth / Authy (recommended)",
                "Hardware Key — YubiKey (most secure)",
            ],
        },
        "length_vs_complexity": {
            "title":   "Length Beats Complexity — The Math",
            "message": "A 4-word Diceware passphrase has ~51.7 bits of entropy — matching an 8-char complex password — while being far easier to remember.",
            "comparison": [
                {"type": "8-char complex",   "example": "@R$ha8x!",                        "entropy": "~52 bits", "memorable": False},
                {"type": "4-word passphrase","example": "correct-horse-battery-staple",    "entropy": "51.7 bits","memorable": True},
                {"type": "5-word passphrase","example": "correct-horse-battery-staple-sky","entropy": "64.6 bits","memorable": True},
            ],
        },
    }
