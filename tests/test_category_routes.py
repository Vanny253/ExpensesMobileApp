# integration test
from conftest import _create_category, _create_user


def test_add_category_creates_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/categories",
        json={
            "user_id": user.user_id,
            "type": "expense",
            "name": "Coffee",
            "icon": "cafe",
        },
    )

    body = response.get_json()

    assert response.status_code == 201
    assert body["name"] == "Coffee"
    assert backend_app_module.Category.query.one().icon == "cafe"


def test_add_category_validates_required_fields(client, app_ctx):
    response = client.post("/categories", json={"user_id": 1, "type": "expense"})

    assert response.status_code == 400
    assert response.get_json() == {
        "message": "user_id, type, name, and icon are required"
    }


def test_get_categories_returns_categories_for_user_and_type(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_category(backend_app_module, user.user_id, type_="expense", name="Coffee")
    _create_category(backend_app_module, user.user_id, type_="income", name="Salary")

    response = client.get(f"/categories/{user.user_id}/expense")
    body = response.get_json()

    assert response.status_code == 200
    assert len(body) == 1
    assert body[0]["name"] == "Coffee"


def test_get_categories_returns_empty_list_when_no_matching_categories(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.get(f"/categories/{user.user_id}/expense")

    assert response.status_code == 200
    assert response.get_json() == []


def test_update_category_updates_existing_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    category = _create_category(backend_app_module, user.user_id, name="Coffee", icon="cafe")

    response = client.put(
        f"/categories/{category.id}",
        json={"name": "Tea", "icon": "leaf"},
    )

    backend_app_module.db.session.refresh(category)

    assert response.status_code == 200
    assert category.name == "Tea"
    assert category.icon == "leaf"


def test_update_category_can_change_type(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    category = _create_category(backend_app_module, user.user_id, type_="expense")

    response = client.put(
        f"/categories/{category.id}",
        json={"type": "income"},
    )

    backend_app_module.db.session.refresh(category)

    assert response.status_code == 200
    assert category.type == "income"


def test_update_category_returns_404_for_missing_record(client, app_ctx):
    response = client.put("/categories/999", json={"name": "Tea"})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Category not found"}


def test_delete_category_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    category = _create_category(backend_app_module, user.user_id)

    response = client.delete(f"/categories/{category.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Category deleted"}
    assert backend_app_module.db.session.get(backend_app_module.Category, category.id) is None


def test_delete_category_returns_404_for_missing_record(client, app_ctx):
    response = client.delete("/categories/999")

    assert response.status_code == 404
    assert response.get_json() == {"message": "Category not found"}
