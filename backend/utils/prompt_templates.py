def vulnerability_analysis_prompt(code: str, language: str) -> str:
    """
    Generates a structured prompt instructing the LLM to return a JSON array
    of vulnerability objects, each including a ready-to-copy fixed_code block.
    """
    return f"""You are a senior application security engineer performing a code security audit.

Analyze the following {language} code for security vulnerabilities.

CRITICAL: Return ONLY a valid JSON array. No conversational text, no markdown fences, no preamble, no postscript.

Each element MUST have exactly these fields:
[
  {{
    "type": "<vulnerability name>",
    "severity": "<Low|Medium|High|Critical>",
    "explanation": "<detailed explanation with line references>",
    "fix": "<step-by-step prose description of how to fix it>",
    "fixed_code": "<COMPLETE corrected code snippet that the user can copy and paste directly — must be valid {language}, covering the vulnerable section or the whole file if small>"
  }}
]

Rules for fixed_code:
- Must be a complete, runnable code snippet (NOT a diff, NOT pseudo-code).
- If the vulnerability affects one function, return the full corrected function.
- If the file is small (under 60 lines), return the entire corrected file.
- Do NOT wrap fixed_code in markdown fences inside the JSON string — just raw source code.
- Escape any double-quotes inside the code as \\".

If NO vulnerabilities exist, return: []

Code to analyze:
{code}
"""


def fix_suggestion_prompt(vuln_type: str, explanation: str) -> str:
    """Generates a prompt for an expanded, step-by-step fix recommendation."""
    return f"""You are a secure coding expert.

Vulnerability type: {vuln_type}
Description: {explanation}

Provide a detailed, step-by-step fix recommendation in plain text.
Include:
1. Root cause
2. Specific code changes needed
3. Best-practice pattern to apply
4. Any relevant library or framework recommendation

Be concise but complete.
"""
