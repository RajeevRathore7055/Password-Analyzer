"""
breach_service.py  —  HaveIBeenPwned k-Anonymity integration (Module 2).

Privacy guarantee:
  • SHA-1 hash generated LOCALLY — never transmitted
  • Only first 5 hex chars of hash sent to HIBP API
  • Full hash matched LOCALLY against returned list
  • Password NEVER leaves this server

Uses httpx (sync) — compatible with FastAPI sync endpoints and replaces
the previously buggy sync `requests` library.
#import hashlib
#import httpx
"""

import hashlib
import httpx

HIBP_URL     = "https://api.pwnedpasswords.com/range/{prefix}"
HIBP_HEADERS = {
    "Add-Padding": "true",
    "User-Agent":  "SecurePass-Checker/3.0",
}
TIMEOUT = 8  # seconds


def check_hibp(password: str) -> dict:
    """
    k-Anonymity breach check against HaveIBeenPwned API.

    Steps:
      1. Hash password with SHA-1 locally
      2. Split: prefix (5 chars) + suffix (35 chars)
      3. Send only prefix to HIBP
      4. Receive ~500 hashes
      5. Match full suffix locally  →  zero false positives
      6. Return structured result with 3-level label

    Returns dict with: is_breached, breach_count, level, message
    On network error: dict with key: error
    """
    sha1   = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix = sha1[:5]
    suffix = sha1[5:]

    try:
        resp = httpx.get(
            HIBP_URL.format(prefix=prefix),
            headers=HIBP_HEADERS,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
    except httpx.TimeoutException:
        return {"error": "HIBP API timed out. Please try again."}
    except httpx.HTTPStatusError as e:
        return {"error": f"HIBP returned HTTP {e.response.status_code}."}
    except httpx.RequestError as e:
        return {"error": f"Could not reach HIBP API: {e}"}

    # Local suffix search — password never compared remotely
    breach_count = 0
    for line in resp.text.splitlines():
        parts = line.split(":")
        if len(parts) == 2 and parts[0].strip() == suffix:
            try:
                breach_count = int(parts[1].strip())
            except ValueError:
                breach_count = 0
            break

    is_breached = breach_count > 0

    # Three-level label system per project report (Module 2.3.4)
    if not is_breached:
        level   = "safe"
        message = "✅ This password has not appeared in any known data breach."
    elif breach_count <= 10:
        level   = "caution"
        message = (
            f"⚠️ Found in {breach_count:,} breach(es). "
            "This password is compromised — consider changing it."
        )
    else:
        level   = "danger"
        message = (
            f"🚨 Found {breach_count:,} times in data breaches! "
            "Hackers have this password — do NOT use it."
        )

    return {
        "is_breached":  is_breached,
        "breach_count": breach_count,
        "level":        level,
        "message":      message,
    }
