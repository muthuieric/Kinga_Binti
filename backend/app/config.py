import os
from pathlib import Path
from pydantic import BaseModel


def _load_dotenv(path: Path) -> None:
    """Minimal .env loader (no external dependency).

    Loads KEY=VALUE lines into os.environ without overriding variables that
    are already set. Only used for local development; production deployments
    should inject secrets via the environment / orchestrator secret store.
    """
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


# Repo-root .env (two levels up from backend/app/), if present.
_REPO_ROOT = Path(__file__).resolve().parents[2]
_load_dotenv(_REPO_ROOT / ".env")

# Absolute fallback storage paths, anchored at the repo root so the backend
# finds the same data files no matter which CWD uvicorn starts from.
_SQLITE_DEFAULT = str(_REPO_ROOT / "backend" / "narratives_meta.db")
_JSON_DEFAULT = str(_REPO_ROOT / "backend" / "narratives_docs.json")


def _env_str(name: str, default: str) -> str:
    val = os.getenv(name)
    if val is None:
        return default
    # Strip inline comments and surrounding quotes/whitespace for .env values.
    val = val.split("#", 1)[0].strip().strip("'\"")
    return val if val != "" else default


def _env_int(name: str, default: int) -> int:
    raw = _env_str(name, str(default))
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = _env_str(name, "true" if default else "false").lower()
    return raw in ("1", "true", "yes", "on")


class Settings(BaseModel):
    PROJECT_NAME: str = "Kinga Binti"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # PostgreSQL Configuration
    POSTGRES_HOST: str = _env_str("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = _env_int("POSTGRES_PORT", 5432)
    POSTGRES_DB: str = _env_str("POSTGRES_DB", "narratives_meta")
    POSTGRES_USER: str = _env_str("POSTGRES_USER", "kingabinti_admin")
    # No default password: credentials come from the environment / .env file.
    # If unset, the PostgreSQL connection fails and storage falls back to SQLite.
    POSTGRES_PASSWORD: str = _env_str("POSTGRES_PASSWORD", "")


    # MongoDB Configuration
    MONGO_URI: str = _env_str("MONGO_URI", "mongodb://localhost:27017/narratives_db")
    MONGO_DB: str = _env_str("MONGO_DB", "narratives_db")

    # Local fallback storage paths (when live external DB servers are unavailable).
    # Absolute (anchored at repo root) so the backend finds the same files no
    # matter which working directory uvicorn is started from. Env overrides may
    # still be relative — those resolve against the process CWD as before.
    SQLITE_PATH: str = _env_str("SQLITE_PATH", _SQLITE_DEFAULT)
    JSON_DOCS_PATH: str = _env_str("JSON_DOCS_PATH", _JSON_DEFAULT)

    # Ethical Consent Requirement
    ENFORCE_STRICT_CONSENT: bool = True

    # English -> Maasai Translation (NLLB + LoRA adapter)
    # The adapter is a PEFT LoRA on facebook/nllb-200-distilled-600M.
    # Nothing is downloaded or loaded at startup; see nlp/translator.py.
    TRANSLATOR_ENABLED: bool = _env_bool("TRANSLATOR_ENABLED", True)
    TRANSLATION_BASE_MODEL: str = _env_str(
        "TRANSLATION_BASE_MODEL", "facebook/nllb-200-distilled-600M"
    )
    TRANSLATION_ADAPTER_MODEL: str = _env_str(
        "TRANSLATION_ADAPTER_MODEL",
        "KnoxDevelopers/English-to-Maasai-language-translation-LoRA",
    )
    # Source/target language codes understood by the NLLB tokenizer.
    TRANSLATION_SRC_LANG: str = _env_str("TRANSLATION_SRC_LANG", "eng_Latn")
    TRANSLATION_TGT_LANG: str = _env_str("TRANSLATION_TGT_LANG", "mas_Latn")
    # float32 is safest for output quality; use bfloat16 to roughly halve RAM use
    # on CPU-only machines. float16 is NOT recommended on CPU (slow/unsupported).
    TRANSLATION_DTYPE: str = _env_str("TRANSLATION_DTYPE", "float32")
    TRANSLATION_MAX_NEW_TOKENS: int = _env_int("TRANSLATION_MAX_NEW_TOKENS", 96)
    # CPU inference controls (important on low-RAM/no-GPU machines).
    # Lower values reduce heat, memory pressure, and hang risk.
    TRANSLATION_NUM_BEAMS: int = _env_int("TRANSLATION_NUM_BEAMS", 1)
    TRANSLATION_CPU_THREADS: int = _env_int("TRANSLATION_CPU_THREADS", 2)
    # Local snapshot directory for the downloaded base model + adapter.
    TRANSLATION_CACHE_DIR: str = _env_str("TRANSLATION_CACHE_DIR", "backend/models")

    # NLP Classifier Model Selection
    # Default: bert-base-multilingual-cased (mBERT) - supports 104 languages including English, Swahili
    # Option: set NLP_USE_AFROXLMR=true to use Davlan/afro-xlmr-base (African language optimized)
    # Note: AfroXLMR is a masked LM; for classification a fine-tuned head is recommended.
    NLP_MODEL_NAME: str = _env_str("NLP_MODEL_NAME", "bert-base-multilingual-cased")
    NLP_USE_AFROXLMR: bool = _env_bool("NLP_USE_AFROXLMR", False)

settings = Settings()

