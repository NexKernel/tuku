"""Pruebas de hashing y JWT."""

import pytest
from jose import JWTError

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("estudiante123")
    assert hashed != "estudiante123"
    assert verify_password("estudiante123", hashed)
    assert not verify_password("incorrecta", hashed)


def test_access_token_roundtrip() -> None:
    token = create_access_token("user-123", role="student")
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == "user-123"
    assert payload["role"] == "student"
    assert payload["type"] == "access"


def test_token_type_mismatch_raises() -> None:
    refresh = create_refresh_token("user-123")
    with pytest.raises(JWTError):
        decode_token(refresh, expected_type="access")
