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
    """Los 15 pasos obligatorios del flujo del tutor Socrático."""

    DETECT_TOPIC = "detect_topic"
    DETECT_SUBTOPIC = "detect_subtopic"
    DETECT_DIFFICULTY = "detect_difficulty"
    DETECT_COMPETENCIES = "detect_competencies"
    EXTRACT_DATA = "extract_data"
    EXPLAIN_STRATEGY = "explain_strategy"
    SOCRATIC_QUESTIONS = "socratic_questions"
    AWAIT_RESPONSE = "await_response"
    FEEDBACK = "feedback"
    SOLVE = "solve"
    SHORT_METHOD = "short_method"
    ELIMINATION_METHOD = "elimination_method"
    COMMON_ERROR = "common_error"
    SIMILAR_EXERCISE = "similar_exercise"
    REGISTER_PERFORMANCE = "register_performance"


class MessageRole(StrEnum):
    USER = "user"
    TUTOR = "tutor"
    SYSTEM = "system"


class TimerMode(StrEnum):
    PRACTICE = "practice"
    SIMULATION = "simulation"
    EXAM = "exam"
