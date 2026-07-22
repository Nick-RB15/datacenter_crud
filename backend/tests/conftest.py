import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from backend.app import create_app, _seed_demo_data
from backend.config import TestConfig
from backend.extensions import db


@pytest.fixture
def app(request):
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # Seed only for the demo-data test; other tests need an empty user table
        # so the first /register can become admin.
        if request.node.name == "test_app_seed_demo_data_on_first_start":
            _seed_demo_data()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()
