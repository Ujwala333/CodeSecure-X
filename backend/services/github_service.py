"""GitHub service — all business logic and GitHub API calls live here."""

import os
import logging
from typing import Any

import httpx
from dotenv import load_dotenv

from utils.github_utils import (
    should_include_file,
    sort_by_priority,
    MAX_FILES,
)

load_dotenv()

logger = logging.getLogger(__name__)

_GITHUB_API_BASE = "https://api.github.com"
_TIMEOUT = httpx.Timeout(15.0)


def _build_headers() -> dict[str, str]:
    """Build GitHub API request headers, injecting token when available."""
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
        logger.debug("GitHub token present — authenticated requests active.")
    else:
        logger.debug("No GITHUB_TOKEN — using unauthenticated requests (60 req/hr).")
    return headers


async def _fetch_tree(client: httpx.AsyncClient, owner: str, repo: str) -> list[dict[str, Any]]:
    """
    Fetch the full recursive file tree for the default branch via the Git Trees API.
    Returns a flat list of tree nodes.
    """
    # First resolve the default branch
    repo_url = f"{_GITHUB_API_BASE}/repos/{owner}/{repo}"
    repo_resp = await client.get(repo_url)

    if repo_resp.status_code == 404:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository '{owner}/{repo}' not found or is private.",
        )
    if repo_resp.status_code == 403:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="GitHub rate limit exceeded. Set GITHUB_TOKEN in .env for higher limits.",
        )
    repo_resp.raise_for_status()

    default_branch: str = repo_resp.json().get("default_branch", "main")
    logger.info("Repo %s/%s — default branch: %s", owner, repo, default_branch)

    # Fetch full recursive tree
    tree_url = (
        f"{_GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/{default_branch}"
        "?recursive=1"
    )
    tree_resp = await client.get(tree_url)

    if tree_resp.status_code == 403:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="GitHub rate limit exceeded. Set GITHUB_TOKEN in .env for higher limits.",
        )
    tree_resp.raise_for_status()

    payload = tree_resp.json()
    if payload.get("truncated"):
        logger.warning(
            "GitHub tree response for %s/%s is truncated — very large repo.",
            owner, repo,
        )

    return payload.get("tree", [])


def _extract_file_metadata(node: dict[str, Any], owner: str, repo: str) -> dict[str, Any] | None:
    """
    Convert a single Git tree node into our file metadata dict.
    Returns None if the node should be skipped.
    """
    if node.get("type") != "blob":
        return None  # skip directories and submodules

    path: str = node.get("path", "")
    size: int = node.get("size", 0)
    filename = path.split("/")[-1]

    if not should_include_file(path, filename, size):
        return None

    download_url = (
        f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}"
    )

    return {
        "filename": filename,
        "path": path,
        "size": size,
        "download_url": download_url,
    }


async def analyze_repository(owner: str, repo: str) -> dict[str, Any]:
    """
    Main service entry point.

    1. Fetch the full recursive file tree from GitHub.
    2. Filter nodes to allowed source files only.
    3. Sort by priority keywords.
    4. Cap at MAX_FILES (20).
    5. Return structured metadata response.
    """
    headers = _build_headers()

    try:
        async with httpx.AsyncClient(headers=headers, timeout=_TIMEOUT) as client:
            tree = await _fetch_tree(client, owner, repo)
    except httpx.TimeoutException as exc:
        from fastapi import HTTPException, status
        logger.error("GitHub API timed out for %s/%s: %s", owner, repo, exc)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="GitHub API request timed out. Please try again.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        # Re-raise HTTPExceptions that we raised ourselves (404, 429, etc.)
        raise
    except Exception as exc:
        from fastapi import HTTPException, status
        logger.exception("Unexpected error fetching GitHub tree for %s/%s", owner, repo)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to contact GitHub API: {exc}",
        ) from exc

    # Filter → prioritise → cap
    candidates: list[dict[str, Any]] = []
    for node in tree:
        meta = _extract_file_metadata(node, owner, repo)
        if meta is not None:
            candidates.append(meta)

    logger.info(
        "%s/%s — %d matching files found before cap (cap=%d).",
        owner, repo, len(candidates), MAX_FILES,
    )

    prioritised = sort_by_priority(candidates)[:MAX_FILES]

    return {
        "repo": f"{owner}/{repo}",
        "total_files": len(prioritised),
        "files": prioritised,
    }
