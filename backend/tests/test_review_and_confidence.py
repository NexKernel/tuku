"""Pruebas del repaso espaciado y de la nota de confianza."""

from datetime import UTC, datetime, timedelta

from app.domain.enums import TutorStep
from app.services.ai.prompts import (
    REVIEW_QUESTION_INSTRUCTION,
    REVIEW_ROUNDS,
    build_step_instruction,
    confidence_note,
)
from app.services.review_service import REVIEW_INTERVALS_DAYS, next_review_due

T0 = datetime(2026, 10, 1, 9, 0, tzinfo=UTC)


def test_intervals_expand() -> None:
    assert list(REVIEW_INTERVALS_DAYS) == sorted(REVIEW_INTERVALS_DAYS)
    assert len(set(REVIEW_INTERVALS_DAYS)) == len(REVIEW_INTERVALS_DAYS)


def test_schedule_after_completing_challenge_and_each_round() -> None:
    assert next_review_due(0, T0) == (1, T0 + timedelta(days=1))
    assert next_review_due(1, T0) == (2, T0 + timedelta(days=3))
    assert next_review_due(2, T0) == (3, T0 + timedelta(days=7))
    assert next_review_due(3, T0) is None


def test_every_round_has_a_retrieval_goal() -> None:
    for rnd in range(1, len(REVIEW_INTERVALS_DAYS) + 1):
        assert REVIEW_ROUNDS[rnd]
    text = REVIEW_QUESTION_INSTRUCTION.format(round_goal=REVIEW_ROUNDS[1], transcript="Niño: hola")
    assert "Niño: hola" in text


def test_confidence_note_describes_change() -> None:
    note = confidence_note(3, 1)
    assert "muy seguro (3/3)" in note
    assert "poco seguro (1/3)" in note
    assert "cambiar" in note


def test_confidence_note_partial_and_empty() -> None:
    assert "más o menos seguro" in confidence_note(None, 2)
    assert confidence_note(None, None) == ""


def test_context_is_injected_in_step_instruction() -> None:
    text = build_step_instruction(TutorStep.METACOGNITION, context=confidence_note(1, 3))
    assert "CONFIANZA DEL NIÑO" in text
