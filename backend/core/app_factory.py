import os

from flask import Flask
from flask_apscheduler import APScheduler
from flask_cors import CORS

from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from models import db
from scheduler import register_tasks


def create_app():
    app = Flask(__name__)
    CORS(app)

    upload_folder = "static/uploads"
    os.makedirs(upload_folder, exist_ok=True)

    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS

    db.init_app(app)

    scheduler = APScheduler()
    scheduler.init_app(app)
    register_tasks(scheduler, app)
    scheduler.start()

    with app.app_context():
        db.create_all()

    return app
