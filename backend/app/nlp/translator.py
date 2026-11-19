"""
English -> Maasai translation via NLLB-200 plus a community-trained LoRA adapter.

Model: facebook/nllb-200-distilled-600M base, with the PEFT LoRA adapter
KnoxDevelopers/English-to-Maasai-language-translation-LoRA (r=16, alpha=32).

Design notes
------------
- Lazy loading: nothing is downloaded or instantiated at import time or at app
  startup. The ~2.4 GB base model and the ~1.1 GB adapter are fetched on the
  first call to get_translator(). This keeps the API bootable on machines that
  have not provisioned the model (and on CI).
- CPU friendly: inference is synchronous and can take seconds on CPU, so callers
  must run it in a worker thread (see routers/translate.py) to avoid blocking
  the event loop.
- Availability reporting: check_availability() returns a structured report so the
  API can answer "why is translation unavailable?" without raising.
- Non-commercial license: the adapter is cc-by-nc-4.0.
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Any, Dict, List, Optional

from ..config import settings

logger = logging.getLogger("nlp_translator")

# Lock guards lazy initialisation so concurrent requests do not load the model twice.
_load_lock = threading.Lock()
_translator_instance: Optional["MaasaiTranslator"] = None


class MaasaiTranslator:
    """Wraps an NLLB seq2seq model with the English->Maasai LoRA adapter applied."""

    def __init__(
        self,
        base_model: Optional[str] = None,
        adapter_model: Optional[str] = None,
        src_lang: Optional[str] = None,
        tgt_lang: Optional[str] = None,
        dtype: Optional[str] = None,
        max_new_tokens: Optional[int] = None,
        cache_dir: Optional[str] = None,
        num_beams: Optional[int] = None,
        cpu_threads: Optional[int] = None,
    ):
        self.base_model = base_model or settings.TRANSLATION_BASE_MODEL
        self.adapter_model = adapter_model or settings.TRANSLATION_ADAPTER_MODEL
        self.src_lang = src_lang or settings.TRANSLATION_SRC_LANG
        self.tgt_lang = tgt_lang or settings.TRANSLATION_TGT_LANG
        self.dtype = dtype or settings.TRANSLATION_DTYPE
        self.max_new_tokens = max_new_tokens or settings.TRANSLATION_MAX_NEW_TOKENS
        self.cache_dir = cache_dir or settings.TRANSLATION_CACHE_DIR
        self.num_beams = max(1, int(num_beams if num_beams is not None else getattr(settings, "TRANSLATION_NUM_BEAMS", 1)))
        self.cpu_threads = max(1, int(cpu_threads if cpu_threads is not None else getattr(settings, "TRANSLATION_CPU_THREADS", 2)))

        self.tokenizer = None
        self.model = None
        self._loaded = False

    # ---------------------------------------------------------------- loading

    def _resolve_dtype(self):
        """Maps the configured dtype string to a torch dtype."""
        import torch

        mapping = {
            "float32": torch.float32,
            "fp32": torch.float32,
            "bfloat16": torch.bfloat16,
            "bf16": torch.bfloat16,
            "float16": torch.float16,
            "fp16": torch.float16,
        }
        return mapping.get(self.dtype.lower(), torch.float32)

    def load(self) -> "MaasaiTranslator":
        """Downloads (if needed) and loads base model + LoRA adapter.

        Raises ImportError when transformers/peft are not installed, so callers
        can distinguish a missing dependency from a corrupt download.
        """
        if self._loaded:
            return self

        try:
            import torch
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            from peft import PeftModel
        except ImportError as exc:  # pragma: no cover - depends on host env
            raise ImportError(
                "English->Maasai translation requires 'transformers', 'peft' and "
                "'torch'. Install them with:  pip install -r backend/requirements.txt"
            ) from exc

        os.makedirs(self.cache_dir, exist_ok=True)

        # Restrict CPU threads before model instantiation so PyTorch never spikes
        # 100% on all cores or starves the OS window manager / UI loop.
        if not torch.cuda.is_available():
            n_threads = min(self.cpu_threads, max(1, os.cpu_count() or 1))
            try:
                torch.set_num_threads(n_threads)
            except Exception:
                pass

        # Check if model is already downloaded locally. If so, enforce local_files_only=True
        # and HF_HUB_OFFLINE=1 to prevent PEFT/Hugging Face Hub from attempting network
        # requests, checking remote file_exists metadata, and retry loops that freeze the app.
        base_dir_name = "models--" + self.base_model.replace("/", "--")
        adapter_dir_name = "models--" + self.adapter_model.replace("/", "--")
        local_base = os.path.isdir(os.path.join(self.cache_dir, base_dir_name, "snapshots"))
        local_adapter = os.path.isdir(os.path.join(self.cache_dir, adapter_dir_name, "snapshots"))

        if local_base and local_adapter:
            os.environ["HF_HUB_OFFLINE"] = "1"

        logger.info("Loading NLLB base model '%s' (local_files_only=%s)...", self.base_model, local_base)

        tokenizer = AutoTokenizer.from_pretrained(
            self.base_model,
            cache_dir=self.cache_dir,
            src_lang=self.src_lang,
            tgt_lang=self.tgt_lang,
            local_files_only=local_base,
        )

        model = AutoModelForSeq2SeqLM.from_pretrained(
            self.base_model,
            cache_dir=self.cache_dir,
            torch_dtype=self._resolve_dtype(),
            # Streams weights into RAM to avoid a second full copy on low-RAM hosts.
            low_cpu_mem_usage=True,
            local_files_only=local_base,
        )

        # Fix vocabulary size mismatch from KnoxDevelopers adapter training
        model.resize_token_embeddings(256205)

        adapter_load_path = self.adapter_model
        if local_adapter:
            snapshots_dir = os.path.join(self.cache_dir, adapter_dir_name, "snapshots")
            try:
                snapshots = [
                    os.path.join(snapshots_dir, s)
                    for s in os.listdir(snapshots_dir)
                    if os.path.isdir(os.path.join(snapshots_dir, s))
                ]
                if snapshots:
                    # Pass the exact local filesystem path to PeftModel so it completely
                    # skips remote Hugging Face API checks and connection timeouts.
                    adapter_load_path = snapshots[0]
            except Exception:
                pass

        logger.info("Applying LoRA adapter '%s'...", adapter_load_path)
        model = PeftModel.from_pretrained(
            model,
            adapter_load_path,
            cache_dir=self.cache_dir,
            local_files_only=local_adapter,
        )

        model.eval()
        if not torch.cuda.is_available():
            n_threads = min(self.cpu_threads, max(1, os.cpu_count() or 1))
            try:
                torch.set_num_threads(n_threads)
            except Exception:
                pass

        self.tokenizer = tokenizer
        self.model = model
        self._loaded = True
        logger.info(
            "Translator ready (%s + adapter %s, dtype=%s, beams=%s, cpu_threads=%s)",
            self.base_model, self.adapter_model, self.dtype, self.num_beams,
            min(self.cpu_threads, max(1, os.cpu_count() or 1)) if not torch.cuda.is_available() else "cuda",
        )
        return self

    # ------------------------------------------------------------- inference

    def translate(
        self,
        text: str,
        target_lang: Optional[str] = None,
        max_new_tokens: Optional[int] = None,
        source_lang: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Translates a string across supported language pairs:
        - English -> Maasai (via NLLB-200 + KnoxDevelopers LoRA adapter)
        - English -> Swahili (via NLLB-200 native)
        - Swahili -> English (via NLLB-200 native)

        Returns the translated text plus language codes and engine metadata.
        """
        if not self._loaded:
            self.load()

        import contextlib
        import torch

        text = (text or "").strip()
        if not text:
            raise ValueError("Text to translate must not be empty.")

        max_tokens = max_new_tokens or self.max_new_tokens
        tokenizer = self.tokenizer
        model = self.model

        # Resolve source language
        raw_src = (source_lang or self.src_lang or "eng_Latn").strip().lower()
        if raw_src in ("swahili", "swh_latn", "sw"):
            src_code = "swh_Latn"
            source_name = "Swahili"
        else:
            src_code = "eng_Latn"
            source_name = "English"

        # Resolve target language and whether to use the Maasai LoRA adapter
        raw_tgt = (target_lang or self.tgt_lang or "mas_Latn").strip().lower()
        if raw_tgt in ("english", "eng_latn", "en"):
            tgt_code = "eng_Latn"
            target_name = "English"
            use_lora = False
        elif raw_tgt in ("swahili", "swh_latn", "sw"):
            tgt_code = "swh_Latn"
            target_name = "Swahili"
            use_lora = False
        else:
            tgt_code = "mas_Latn"
            target_name = "Maasai"
            # Only English -> Maa uses the LoRA adapter
            use_lora = (src_code == "eng_Latn")

        # NLLB requires the source language token to be set on the tokenizer.
        tokenizer.src_lang = src_code

        encoded = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=getattr(tokenizer, "model_max_length", 1024) or 1024,
        )

        # forced_bos_token_id is what actually makes NLLB generate the target language.
        forced_bos_token_id = tokenizer.convert_tokens_to_ids(tgt_code)

        gen_kwargs = {
            **encoded,
            "forced_bos_token_id": forced_bos_token_id,
            "max_new_tokens": max_tokens,
            "num_beams": self.num_beams,
            "no_repeat_ngram_size": 3,
        }
        # Greedy decoding is far lighter on CPU than beam search.
        if self.num_beams <= 1:
            gen_kwargs["do_sample"] = False

        # When not translating to Maa with LoRA, disable the adapter so base NLLB-200
        # produces clean native translations without distortion from the Maa adapter.
        if not use_lora and hasattr(model, "disable_adapter"):
            adapter_cm = model.disable_adapter()
        else:
            adapter_cm = contextlib.nullcontext()

        with torch.inference_mode(), adapter_cm:
            generated = model.generate(**gen_kwargs)

        translation = tokenizer.batch_decode(generated, skip_special_tokens=True)[0]

        return {
            "source_text": text,
            "translated_text": translation.strip(),
            "source_language": source_name,
            "target_language": target_name,
            "src_lang_code": src_code,
            "tgt_lang_code": tgt_code,
            "model": self.base_model,
            "adapter": self.adapter_model if use_lora else None,
        }

    def translate_batch(
        self,
        texts: List[str],
        target_lang: Optional[str] = None,
        source_lang: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Translates several strings, one at a time."""
        return [self.translate(t, target_lang=target_lang, source_lang=source_lang) for t in texts]


def check_availability() -> Dict[str, Any]:
    """Reports whether translation can run, and why not if it cannot.

    Does not download the model; it only checks dependencies and local snapshot
    presence so the API can respond quickly.
    """
    report: Dict[str, Any] = {
        "enabled": settings.TRANSLATOR_ENABLED,
        "base_model": settings.TRANSLATION_BASE_MODEL,
        "adapter_model": settings.TRANSLATION_ADAPTER_MODEL,
        "available": False,
        "reason": None,
        "missing_dependencies": [],
        "weights_present": False,
        "supported_pairs": [
            {"source": "English", "target": "Maa", "engine": "NLLB-200 + LoRA"},
            {"source": "English", "target": "Swahili", "engine": "NLLB-200 Native"},
            {"source": "Swahili", "target": "English", "engine": "NLLB-200 Native"},
        ],
    }

    if not settings.TRANSLATOR_ENABLED:
        report["reason"] = "Translation disabled via TRANSLATOR_ENABLED=false."
        return report

    missing: List[str] = []
    for module_name in ("torch", "transformers", "peft", "safetensors"):
        try:
            __import__(module_name)
        except ImportError:
            missing.append(module_name)
    report["missing_dependencies"] = missing

    if missing:
        report["reason"] = (
            "Missing Python dependencies: "
            + ", ".join(missing)
            + ". Install with: pip install -r backend/requirements.txt"
        )
        return report

    # Look for a locally cached snapshot so we can say whether a download is pending.
    cache_dir = settings.TRANSLATION_CACHE_DIR
    try:
        entries = os.listdir(cache_dir)
    except OSError:
        entries = []

    weights_present = any(
        os.path.isdir(os.path.join(cache_dir, entry))
        and any(
            f.endswith(".safetensors")
            for f in os.listdir(os.path.join(cache_dir, entry))
        )
        for entry in entries
    )
    report["weights_present"] = weights_present

    if not weights_present:
        report["reason"] = (
            "Model weights not yet downloaded locally. The first translation "
            "request will fetch ~3.5 GB (NLLB base + LoRA adapter)."
        )
        return report

    report["available"] = True
    return report


def get_translator() -> MaasaiTranslator:
    """Returns the process-wide translator, loading it on first use."""
    global _translator_instance

    if _translator_instance is not None and _translator_instance._loaded:
        return _translator_instance

    with _load_lock:
        if _translator_instance is None:
            _translator_instance = MaasaiTranslator()
        if not _translator_instance._loaded:
            _translator_instance.load()
        return _translator_instance