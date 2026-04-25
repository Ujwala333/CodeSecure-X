"""Pure helper utilities for GitHub integration — no API calls, no side effects."""

import re
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS: frozenset[str] = frozenset(
    {".py", ".js", ".ts", ".java", ".cpp", ".c"}
)

IGNORED_DIRS: frozenset[str] = frozenset(
    {"node_modules", ".git", "dist", "build", "__pycache__", ".next", "venv"}
)

PRIORITY_KEYWORDS: tuple[str, ...] = (
    "auth", "api", "db", "config", "routes", "middleware", "database"
)

MAX_FILE_SIZE_BYTES: int = 300 * 1024   # 300 KB
MAX_FILES: int = 20


# ── URL Parsing ────────────────────────────────────────────────────────────────

def parse_github_url(url: str) -> tuple[str, str]:
    """
    Extract (owner, repo) from a GitHub URL.

    Accepts:
      - https://github.com/owner/repo
      - https://github.com/owner/repo/
      - https://github.com/owner/repo.git

    Raises ValueError if the URL is not a valid GitHub repo URL.
    """
    try:
        parsed = urlparse(url.strip())
    except Exception as exc:
        raise ValueError(f"Unparseable URL: {exc}") from exc

    if parsed.scheme not in {"http", "https"}:
        raise ValueError("URL must start with http:// or https://")

    if parsed.netloc not in {"github.com", "www.github.com"}:
        raise ValueError(f"Not a GitHub URL — host is '{parsed.netloc}'")

    # Strip leading slash and trailing slashes / .git
    path = parsed.path.lstrip("/").rstrip("/").removesuffix(".git")
    parts = [p for p in path.split("/") if p]

    if len(parts) < 2:
        raise ValueError(
            "URL must point to a repository: https://github.com/owner/repo"
        )

    owner, repo = parts[0], parts[1]

    if not re.match(r"^[\w.\-]+$", owner) or not re.match(r"^[\w.\-]+$", repo):
        raise ValueError(f"Invalid owner '{owner}' or repo '{repo}'")

    logger.debug("Parsed GitHub URL → owner=%s repo=%s", owner, repo)
    return owner, repo


# ── File Filtering ─────────────────────────────────────────────────────────────

def is_ignored_path(path: str) -> bool:
    """Return True if any segment of the path is in IGNORED_DIRS."""
    segments = path.split("/")
    return any(seg in IGNORED_DIRS for seg in segments)


def has_allowed_extension(filename: str) -> bool:
    """Return True if the file has one of the allowed source-code extensions."""
    dot = filename.rfind(".")
    if dot == -1:
        return False
    return filename[dot:].lower() in ALLOWED_EXTENSIONS


def is_within_size_limit(size: int) -> bool:
    """Return True if the file size is at or below the 300 KB limit."""
    return size <= MAX_FILE_SIZE_BYTES


def should_include_file(path: str, filename: str, size: int) -> bool:
    """
    Composite filter — all three conditions must be true:
    1. Not inside an ignored directory
    2. Has an allowed source-code extension
    3. Does not exceed the size limit
    """
    return (
        not is_ignored_path(path)
        and has_allowed_extension(filename)
        and is_within_size_limit(size)
    )


# ── Priority Scoring ───────────────────────────────────────────────────────────

def priority_score(path: str) -> int:
    """
    Score a file path based on the presence of priority keywords.
    Higher score = should appear earlier in results.
    One point per unique keyword match (case-insensitive).
    """
    lower = path.lower()
    return sum(1 for kw in PRIORITY_KEYWORDS if kw in lower)


def sort_by_priority(files: list[dict]) -> list[dict]:
    """Sort file dicts descending by priority_score, then ascending by path."""
    return sorted(
        files,
        key=lambda f: (-priority_score(f["path"]), f["path"]),
    )
