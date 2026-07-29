from app.models.user_model import users_collection


def create_user(user_data):
    """
    Insert a new user into MongoDB.
    """
    result = users_collection.insert_one(user_data)

    return {
        "message": "User created successfully",
        "user_id": str(result.inserted_id)
    }