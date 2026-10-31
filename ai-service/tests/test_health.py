import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import Settings, get_settings

client = TestClient(app)


def test_app_initialization():
    """Verify application initializes and root route responds"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "eventpilot-ai-service"
    assert data["status"] == "online"


def test_health_endpoint():
    """Verify GET /health returns HTTP 200 and required contract"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()

    assert data == {
        "status": "healthy",
        "service": "eventpilot-ai-service",
        "version": "1.0.0",
    }


def test_not_found_handling():
    """Verify invalid endpoints return 404"""
    response = client.get("/nonexistent-ai-route")
    assert response.status_code == 404


def test_settings_validation():
    """Verify settings validation logic"""
    settings = get_settings()
    assert settings.SERVICE_NAME == "eventpilot-ai-service"
    assert settings.PORT > 0
    assert settings.SERVICE_VERSION == "1.0.0"

    # Test port validation constraints
    with pytest.raises(Exception):
        Settings(PORT=70000)  # Exceeds max 65535
