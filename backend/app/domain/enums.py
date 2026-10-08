"""Enumeraciones del dominio."""

from enum import StrEnum


class UserRole(StrEnum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class Difficulty(StrEnum):
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    OLYMPIC = "olympic"


class TutorStep(StrEnum):
    """Pasos del flujo de pensamiento de primaria.

    El orden de cada camino vive en `prompts.PATHS`, no en el orden de esta enumeración.
    """

    CURIOSITY = "curiosity"
    UNDERSTAND = "understand"
    HYPOTHESIS = "hypothesis"
    REASONING = "reasoning"
    EVIDENCE = "evidence"
    PERSPECTIVES = "perspectives"
    CONCLUSION = "conclusion"
    METACOGNITION = "metacognition"
    TRANSFER = "transfer"
    # Camino "problema" (matemática): estimar → planear sin calcular → calcular → revisar.
    ESTIMATE = "estimate"
    PLAN = "plan"
    SOLVE = "solve"
    CHECK = "check"


class MessageRole(StrEnum):
    USER = "user"
    TUTOR = "tutor"
    SYSTEM = "system"


class TimerMode(StrEnum):
    PRACTICE = "practice"
    SIMULATION = "simulation"
    EXAM = "exam"
