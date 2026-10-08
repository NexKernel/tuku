"""Registro central de modelos — importa todo para que Alembic los descubra."""

from app.domain.base import Base
from app.domain.models.admin import AIUsage, AppSetting
from app.domain.models.academic import Question, Subject, Subtopic, Topic
from app.domain.models.review import Review
from app.domain.models.tutor import Attempt, Conversation, Message
from app.domain.models.user import StudentProfile, User

__all__ = [
    "Base",
    "User",
    "StudentProfile",
    "Subject",
    "Topic",
    "Subtopic",
    "Question",
    "Conversation",
    "Message",
    "Attempt",
    "Review",
    "AIUsage",
    "AppSetting",
]
