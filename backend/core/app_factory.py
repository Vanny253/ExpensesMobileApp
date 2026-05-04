import os

from flask import Flask
from flask_apscheduler import APScheduler
from flask_cors import CORS

from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from models import db
from scheduler import register_tasks


def create_app():
    # ✅ FIX 1: Proper Flask static config
    app = Flask(
        __name__,
        static_folder="static",
        static_url_path="/static"
    )

    CORS(app)

    # ✅ FIX 2: Absolute BASE directory
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    # ✅ FIX 3: Absolute upload folder path
    upload_folder = os.path.join(app.root_path, "static", "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    app.config["UPLOAD_FOLDER"] = upload_folder

    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS

    # DB init
    db.init_app(app)

    # Scheduler
    scheduler = APScheduler()
    scheduler.init_app(app)
    register_tasks(scheduler, app)
    scheduler.start()

    # Create tables
    with app.app_context():
        db.create_all()

    return app