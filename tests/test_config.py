import importlib.util
from pathlib import Path


def load_config_module():
    path = Path(__file__).resolve().parents[1] / "backend" / "config.py"
    spec = importlib.util.spec_from_file_location("config_under_test", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_config_builds_expected_sqlalchemy_uri():
    config = load_config_module()

    assert config.DB_USERNAME == "root"
    assert config.DB_PASSWORD == "admin6011Sql"
    assert config.DB_HOST == "127.0.0.1"
    assert config.DB_NAME == "expense_tracker"
    assert (
        config.SQLALCHEMY_DATABASE_URI
        == "mysql+pymysql://root:admin6011Sql@127.0.0.1/expense_tracker"
    )


def test_config_disables_track_modifications():
    config = load_config_module()

    assert config.SQLALCHEMY_TRACK_MODIFICATIONS is False
