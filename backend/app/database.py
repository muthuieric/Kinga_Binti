import json
import os
import sqlite3
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging

from .config import settings

logger = logging.getLogger("db_service")

# Global states
_use_sqlite_fallback = True
_use_json_fallback = True
_pg_pool = None
_mongo_client = None
_initialized = False
_records_cache: Optional[List[Dict[str, Any]]] = None


def _invalidate_records_cache():
    global _records_cache
    _records_cache = None


def _ensure_initialized():
    if not _initialized:
        init_databases()


def init_databases():
    """Initializes SQL and NoSQL storage with automatic fallback."""
    global _use_sqlite_fallback, _use_json_fallback, _pg_pool, _mongo_client, _initialized

    # 1. SQL Initialization (PostgreSQL or SQLite fallback)
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            connect_timeout=3
        )
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS narrative_metadata (
                    id SERIAL PRIMARY KEY,
                    narrative_id VARCHAR(64) UNIQUE NOT NULL,
                    age_band VARCHAR(20) NOT NULL,
                    gender VARCHAR(20) NOT NULL,
                    sub_county VARCHAR(50) NOT NULL,
                    source_org VARCHAR(100) NOT NULL,
                    consent_given BOOLEAN NOT NULL,
                    consent_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                    date_collected TIMESTAMP DEFAULT NOW()
                );
            """)
            conn.commit()
        conn.close()
        _use_sqlite_fallback = False
        logger.info("Connected to PostgreSQL successfully.")
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Using SQLite fallback.")
        _use_sqlite_fallback = True
        # Never create an empty DB in a stray CWD: resolve to absolute first so
        # a misconfigured SQLITE_PATH can't silently hide the real data file.
        sqlite_path = os.path.abspath(settings.SQLITE_PATH)
        parent = os.path.dirname(sqlite_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        if sqlite_path != os.path.abspath(settings.SQLITE_PATH):
            logger.info(f"Resolved SQLite path to {sqlite_path}")
        conn = sqlite3.connect(sqlite_path)
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS narrative_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    narrative_id TEXT UNIQUE NOT NULL,
                    age_band TEXT NOT NULL,
                    gender TEXT NOT NULL,
                    sub_county TEXT NOT NULL,
                    source_org TEXT NOT NULL,
                    consent_given INTEGER NOT NULL,
                    consent_timestamp TEXT NOT NULL,
                    date_collected TEXT NOT NULL
                );
            """)
        conn.close()

    # 2. NoSQL Initialization (MongoDB or JSON documents fallback)
    try:
        import pymongo
        client = pymongo.MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        client.server_info() # force connection check
        _mongo_client = client
        _use_json_fallback = False
        logger.info("Connected to MongoDB successfully.")
    except Exception as e:
        logger.warning(f"MongoDB connection failed ({e}). Using local JSON document store.")
        _use_json_fallback = True
        os.makedirs(os.path.dirname(settings.JSON_DOCS_PATH), exist_ok=True)
        if not os.path.exists(settings.JSON_DOCS_PATH):
            with open(settings.JSON_DOCS_PATH, "w", encoding="utf-8") as f:
                json.dump([], f)

    _initialized = True
    _invalidate_records_cache()


def _load_json_docs() -> List[Dict[str, Any]]:
    if not os.path.exists(settings.JSON_DOCS_PATH):
        return []
    try:
        with open(settings.JSON_DOCS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _write_json_docs(docs: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(settings.JSON_DOCS_PATH), exist_ok=True)
    with open(settings.JSON_DOCS_PATH, "w", encoding="utf-8") as f:
        json.dump(docs, f, indent=2, ensure_ascii=False)


def save_narrative_record(
    metadata: Dict[str, Any],
    narrative_doc: Dict[str, Any]
) -> str:
    """
    Saves unstructured narrative into NoSQL and structured metadata into SQL.
    Ensures pseudonymised linkage using narrative_id.
    """
    _ensure_initialized()
    narrative_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    narrative_doc = dict(narrative_doc)
    narrative_doc["narrative_id"] = narrative_id
    narrative_doc["created_at"] = now_iso

    # Save to NoSQL
    if not _use_json_fallback and _mongo_client:
        db = _mongo_client[settings.MONGO_DB]
        db.narratives.insert_one(dict(narrative_doc))
    else:
        docs = _load_json_docs()
        docs.append(narrative_doc)
        _write_json_docs(docs)

    # Save to SQL
    if not _use_sqlite_fallback:
        import psycopg2
        conn = psycopg2.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD
        )
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO narrative_metadata
                (narrative_id, age_band, gender, sub_county, source_org, consent_given, consent_timestamp, date_collected)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                narrative_id,
                metadata["age_band"],
                metadata["gender"],
                metadata["sub_county"],
                metadata["source_org"],
                metadata["consent_given"]
            ))
            conn.commit()
        conn.close()
    else:
        conn = sqlite3.connect(settings.SQLITE_PATH)
        with conn:
            conn.execute("""
                INSERT INTO narrative_metadata
                (narrative_id, age_band, gender, sub_county, source_org, consent_given, consent_timestamp, date_collected)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                narrative_id,
                metadata["age_band"],
                metadata["gender"],
                metadata["sub_county"],
                metadata["source_org"],
                1 if metadata["consent_given"] else 0,
                now_iso,
                now_iso
            ))
        conn.close()

    _invalidate_records_cache()
    return narrative_id


def save_narrative_records_bulk(records: List[Dict[str, Any]]) -> List[str]:
    """
    Saves multiple (metadata, narrative_doc) pairs efficiently.
    Each item must be {"metadata": {...}, "narrative_doc": {...}}.
    """
    if not records:
        return []
    _ensure_initialized()
    now_iso = datetime.now(timezone.utc).isoformat()
    ids: List[str] = []
    prepared_docs = []
    prepared_meta = []

    for item in records:
        narrative_id = str(uuid.uuid4())
        ids.append(narrative_id)
        doc = dict(item.get("narrative_doc", {}))
        doc["narrative_id"] = narrative_id
        doc["created_at"] = now_iso
        prepared_docs.append(doc)
        meta = dict(item.get("metadata", {}))
        meta["narrative_id"] = narrative_id
        meta["now_iso"] = now_iso
        prepared_meta.append(meta)

    # NoSQL / JSON batch
    if not _use_json_fallback and _mongo_client:
        db = _mongo_client[settings.MONGO_DB]
        # insert_many mutates docs by adding _id; use copies
        db.narratives.insert_many([dict(d) for d in prepared_docs])
    else:
        docs = _load_json_docs()
        docs.extend(prepared_docs)
        _write_json_docs(docs)

    # SQL batch
    if not _use_sqlite_fallback:
        import psycopg2
        conn = psycopg2.connect(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD
        )
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO narrative_metadata
                (narrative_id, age_band, gender, sub_county, source_org, consent_given, consent_timestamp, date_collected)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, [(
                m["narrative_id"], m.get("age_band"), m.get("gender"),
                m.get("sub_county"), m.get("source_org"), m.get("consent_given")
            ) for m in prepared_meta])
            conn.commit()
        conn.close()
    else:
        conn = sqlite3.connect(settings.SQLITE_PATH)
        with conn:
            conn.executemany("""
                INSERT INTO narrative_metadata
                (narrative_id, age_band, gender, sub_county, source_org, consent_given, consent_timestamp, date_collected)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, [(
                m["narrative_id"], m.get("age_band"), m.get("gender"),
                m.get("sub_county"), m.get("source_org"),
                1 if m.get("consent_given") else 0,
                m["now_iso"], m["now_iso"]
            ) for m in prepared_meta])
        conn.close()

    _invalidate_records_cache()
    return ids


def get_all_records() -> List[Dict[str, Any]]:
    """Retrieves merged SQL metadata and NoSQL narrative analysis records."""
    global _records_cache
    _ensure_initialized()
    if _records_cache is not None:
        return [dict(r) for r in _records_cache]

    # 1. Fetch NoSQL docs
    docs_by_id = {}
    if not _use_json_fallback and _mongo_client:
        db = _mongo_client[settings.MONGO_DB]
        for doc in db.narratives.find({}, {"_id": 0}):
            nid = doc.get("narrative_id")
            if nid:
                docs_by_id[nid] = doc
    else:
        for doc in _load_json_docs():
            nid = doc.get("narrative_id")
            if nid:
                docs_by_id[nid] = doc

    # 2. Fetch SQL rows
    meta_rows = []
    if not _use_sqlite_fallback:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(
                host=settings.POSTGRES_HOST,
                port=settings.POSTGRES_PORT,
                dbname=settings.POSTGRES_DB,
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD
            )
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM narrative_metadata ORDER BY id DESC")
                meta_rows = cur.fetchall()
            conn.close()
        except Exception:
            meta_rows = []
    else:
        conn = sqlite3.connect(settings.SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM narrative_metadata ORDER BY id DESC")
        meta_rows = [dict(row) for row in cur.fetchall()]
        conn.close()

    # 3. Merge
    combined = []
    for meta in meta_rows:
        nid = meta["narrative_id"]
        doc = docs_by_id.get(nid, {})
        item = {
            "narrative_id": nid,
            "age_band": meta["age_band"],
            "gender": meta["gender"],
            "sub_county": meta["sub_county"],
            "source_org": meta["source_org"],
            "consent_given": bool(meta["consent_given"]),
            "date_collected": str(meta.get("date_collected", "")),
            "narrative": doc.get("narrative", ""),
            "language": doc.get("language", ""),
            "label": doc.get("label", ""),
            "prediction_label": doc.get("prediction_label", ""),
            "prediction_score": doc.get("prediction_score", 0.0),
            "discourse_stance": doc.get("discourse_stance", ""),
            "detected_markers": doc.get("detected_markers", []),
            "cultural_context_notes": doc.get("cultural_context_notes", "")
        }
        combined.append(item)

    _records_cache = combined
    return [dict(r) for r in combined]
