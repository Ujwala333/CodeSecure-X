import os
import json
import re
import logging
from typing import Any

from openai import OpenAI
from dotenv import load_dotenv

from utils.prompt_templates import vulnerability_analysis_prompt, fix_suggestion_prompt

# Max attempts to get valid JSON from the LLM before raising
_MAX_JSON_RETRIES = 2

# Explicitly load backend/.env relative to this file's location
ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

logger = logging.getLogger(__name__)

_api_key = os.getenv("NEBIUS_API_KEY", "").strip()

if _api_key:
    _client: OpenAI | None = OpenAI(
        api_key=_api_key,
        base_url="https://api.groq.com/openai/v1",
        timeout=90.0,
        max_retries=0,
    )
    logger.info("Groq LLM client initialised.")
else:
    _client = None
    logger.warning("NEBIUS_API_KEY not set in backend/.env — running in demo mode.")

_MODEL = "llama-3.3-70b-versatile"


def _sanitise_llm_output(text: str) -> str:
    """Strip markdown fences and leading/trailing prose from raw LLM output."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    # Remove control characters that break JSON parsing (except \t \n \r)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return text.strip()


def _balanced_extract(text: str, open_ch: str, close_ch: str) -> str | None:
    """Extract the outermost balanced bracket block from text."""
    start = text.find(open_ch)
    if start == -1:
        return None
    depth = 0
    in_string = False
    escape = False
    for i, ch in enumerate(text[start:], start):
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return None


def _extract_json(text: str) -> Any:
    """
    Robustly extract JSON from a string that might contain conversational text
    or markdown fences. Uses balanced-bracket extraction to avoid rfind traps.
    """
    text = _sanitise_llm_output(text)

    # 1. Try direct parse (happy path)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Balanced-bracket extraction — handles prose before/after the JSON
    first_bracket = text.find('[')
    first_brace = text.find('{')

    if first_bracket != -1 and (first_brace == -1 or first_bracket < first_brace):
        block = _balanced_extract(text, '[', ']')
    elif first_brace != -1:
        block = _balanced_extract(text, '{', '}')
    else:
        block = None

    if block:
        try:
            return json.loads(block)
        except json.JSONDecodeError as exc:
            logger.error("Balanced-extract JSON parse failed: %s", exc)
            logger.error("Problematic block (first 500 chars): %.500s", block)

    logger.error("All JSON extraction strategies failed. Raw text (first 500 chars): %.500s", text)
    raise json.JSONDecodeError("Could not extract valid JSON from LLM output", text, 0)

def analyze_code_vulnerabilities(code: str, language: str) -> list[dict]:
    """
    Send code to Nebius LLM for vulnerability analysis.
    Retries up to _MAX_JSON_RETRIES times on bad JSON before raising.
    Falls back to demo data ONLY if NEBIUS_API_KEY is not set in .env.
    """
    if _client is None:
        logger.info("No API key — returning demo vulnerabilities.")
        return _demo_vulnerabilities(language)

    # Truncate large files — LLM performs best on focused code segments
    MAX_CHARS = 8_000
    if len(code) > MAX_CHARS:
        logger.info(
            "Code truncated from %d to %d chars for LLM analysis", len(code), MAX_CHARS
        )
        code = code[:MAX_CHARS] + "\n# ... (truncated for analysis)"

    system_msg = (
        "You are an expert application security engineer. "
        "You MUST respond with a valid JSON array only. "
        "No markdown fences, no prose, no preamble, no postscript. "
        "Start your response with '[' and end with ']'."
    )
    messages: list[dict] = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": vulnerability_analysis_prompt(code, language)},
    ]

    last_exc: Exception | None = None
    for attempt in range(1, _MAX_JSON_RETRIES + 1):
        try:
            response = _client.chat.completions.create(
                model=_MODEL,
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
            )
            raw = (response.choices[0].message.content or "").strip()
            logger.debug("LLM raw response (attempt %d, first 200 chars): %.200s", attempt, raw)

            vulns = _extract_json(raw)

            if not isinstance(vulns, list):
                raise ValueError(f"LLM returned {type(vulns).__name__}, expected list")

            logger.info("LLM scan succeeded on attempt %d — %d vulns found", attempt, len(vulns))
            return vulns

        except (json.JSONDecodeError, ValueError) as exc:
            last_exc = exc
            logger.warning("Attempt %d/%d: bad JSON from LLM — %s", attempt, _MAX_JSON_RETRIES, exc)
            if attempt < _MAX_JSON_RETRIES:
                # Append assistant's bad reply + correction request for next attempt
                messages.append({"role": "assistant", "content": raw if 'raw' in dir() else ""})
                messages.append({
                    "role": "user",
                    "content": (
                        "Your previous response was not valid JSON. "
                        "Return ONLY a raw JSON array starting with '[' and ending with ']'. "
                        "No explanation, no markdown, no extra text."
                    ),
                })

        except Exception as exc:
            logger.error("Nebius API error: %s", exc)
            raise RuntimeError(f"LLM service error: {exc}") from exc

    raise RuntimeError(
        f"LLM returned invalid JSON after {_MAX_JSON_RETRIES} attempts — please try again."
    ) from (last_exc if isinstance(last_exc, BaseException) else None)


def explain_vulnerability(vuln_type: str, explanation: str) -> str:
    """Return an expanded fix recommendation for a specific vulnerability."""
    if _client is None:
        return "Set NEBIUS_API_KEY in backend/.env to get detailed fix recommendations."

    prompt = fix_suggestion_prompt(vuln_type, explanation)
    try:
        response = _client.chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as exc:
        logger.error("Nebius explain error: %s", exc)
        raise RuntimeError(f"LLM service error: {exc}") from exc


def _demo_vulnerabilities(language: str) -> list[dict]:
    """Fallback demo data — only used when NEBIUS_API_KEY is missing from .env."""
    return [
        {
            "type": "SQL Injection",
            "severity": "High",
            "explanation": (
                f"[DEMO — add NEBIUS_API_KEY to backend/.env for real AI analysis] "
                f"The {language} code concatenates user input directly into SQL."
            ),
            "fix": "Use parameterised queries or an ORM.",
        }
    ]
