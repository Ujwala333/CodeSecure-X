"""GitHub router — thin layer: request validation → service call → response."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, field_validator

from services.github_service import analyze_repository
from utils.github_utils import parse_github_url

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/github", tags=["GitHub"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class RepoAnalyzeRequest(BaseModel):
    repo_url: str

    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        try:
            parse_github_url(v)
        except ValueError as exc:
            raise ValueError(str(exc)) from exc
        return v.strip()


class FileMetadata(BaseModel):
    filename: str
    path: str
    size: int
    download_url: str


class RepoAnalyzeResponse(BaseModel):
    repo: str
    total_files: int
    files: list[FileMetadata]


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post(
    "/analyze-repo",
    response_model=RepoAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyse a public GitHub repository",
    description=(
        "Fetches the file tree of a public GitHub repository and returns "
        "filtered, prioritised source-file metadata. File contents are NOT fetched."
    ),
)
async def analyze_repo(body: RepoAnalyzeRequest) -> Any:
    """Return filtered file metadata for a public GitHub repository."""
    try:
        owner, repo = parse_github_url(body.repo_url)
    except ValueError as exc:
        # Should not reach here (validator already ran), but guard anyway
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    logger.info("GitHub repo analysis requested: %s/%s", owner, repo)
    result = await analyze_repository(owner, repo)
    logger.info(
        "GitHub repo analysis complete: %s — %d files returned",
        result["repo"], result["total_files"],
    )
    return result
