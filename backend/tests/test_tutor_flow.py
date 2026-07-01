"""Pruebas de la máquina de estados del tutor Socrático."""

from app.domain.enums import TutorStep
from app.services.ai.prompts import (
    STEP_INSTRUCTIONS,
    STEP_ORDER,
    build_step_instruction,
    next_step,
)


def test_flow_has_exactly_15_steps() -> None:
    assert len(STEP_ORDER) == 15
    assert STEP_ORDER[0] == TutorStep.DETECT_TOPIC
    assert STEP_ORDER[-1] == TutorStep.REGISTER_PERFORMANCE


def test_every_step_has_instruction() -> None:
    for step in TutorStep:
        assert step in STEP_INSTRUCTIONS
        assert STEP_INSTRUCTIONS[step]


def test_next_step_advances_and_saturates() -> None:
    assert next_step(TutorStep.DETECT_TOPIC) == TutorStep.DETECT_SUBTOPIC
    assert next_step(TutorStep.REGISTER_PERFORMANCE) == TutorStep.REGISTER_PERFORMANCE


def test_hint_level_injected() -> None:
    text = build_step_instruction(TutorStep.SOCRATIC_QUESTIONS, hint_level=2)
    assert "PISTA 2" in text
