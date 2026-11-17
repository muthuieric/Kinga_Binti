from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from ..nlp.lexicon import ENGLISH_LEXICON, MAA_LEXICON, SWAHILI_LEXICON

router = APIRouter(prefix="/lexicon", tags=["Cultural & Dialect Lexicon"])

class NewLexiconTerm(BaseModel):
    language: str = Field(..., description="'English', 'Maa' or 'Swahili'")
    category: str = Field(..., description="'fgm', 'child_marriage', or 'advocacy_challenge'")
    term: str = Field(..., min_length=2)
    meaning: str = Field(..., min_length=3)
    weight: float = Field(default=0.85, ge=0.1, le=1.0)

@router.get("")
async def get_trilingual_lexicon():
    """
    Returns the comprehensive English, Maa and Swahili discourse lexicons for qualitative researchers.
    Covers female circumcision rites, early betrothal terminology, and counter-narrative advocacy markers.
    """
    return {
        "english": {
            "language_family": "Germanic (Indo-European)",
            "region": "Global",
            "categories": ENGLISH_LEXICON,
            "total_terms": sum(len(terms) for terms in ENGLISH_LEXICON.values())
        },
        "maa": {
            "language_family": "Southern Nilotic",
            "region": "Narok & Kajiado Counties",
            "categories": MAA_LEXICON,
            "total_terms": sum(len(terms) for terms in MAA_LEXICON.values())
        },
        "swahili": {
            "language_family": "Bantu (Niger-Congo)",
            "region": "National & Regional Lingua Franca",
            "categories": SWAHILI_LEXICON,
            "total_terms": sum(len(terms) for terms in SWAHILI_LEXICON.values())
        }
    }

@router.post("/term", status_code=status.HTTP_201_CREATED)
async def add_lexicon_term(new_term: NewLexiconTerm):
    """
    Registers a new field dialect marker identified during qualitative community interviews.
    Expands the trilingual NLP corpus vocabulary.
    """
    lang_key = new_term.language.lower()
    cat_key = new_term.category.lower()

    if "english" in lang_key:
        target_lexicon = ENGLISH_LEXICON
    elif "maa" in lang_key:
        target_lexicon = MAA_LEXICON
    else:
        target_lexicon = SWAHILI_LEXICON

    if cat_key not in target_lexicon:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category must be one of: {list(target_lexicon.keys())}"
        )

    # Check for duplicates
    for existing in target_lexicon[cat_key]:
        if existing["term"].lower() == new_term.term.lower():
            return {
                "status": "already_exists",
                "message": f"Term '{new_term.term}' is already catalogued."
            }

    target_lexicon[cat_key].append({
        "term": new_term.term,
        "meaning": new_term.meaning,
        "weight": new_term.weight
    })

    return {
        "status": "created",
        "message": f"Term '{new_term.term}' successfully registered in {new_term.language} {new_term.category} lexicon.",
        "term": {
            "term": new_term.term,
            "meaning": new_term.meaning,
            "weight": new_term.weight
        }
    }

