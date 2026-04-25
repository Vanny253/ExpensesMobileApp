from routes.budget_routes import budget_bp
from routes.category_routes import category_bp
from routes.feedback_routes import feedback_bp
from routes.report_routes import report_bp
from routes.transaction_routes import transaction_bp
from routes.user_routes import user_bp


def register_blueprints(app):
    app.register_blueprint(transaction_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(feedback_bp)
