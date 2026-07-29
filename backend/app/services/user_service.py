import bcrypt
from bson import ObjectId

from app.models.user_model import users_collection
from app.utils.jwt_helper import generate_token


def create_user(user_data):
    """
    Create a new user after validating input,
    checking duplicate email, and hashing the password.
    """

    # Validate required fields
    if not user_data.get("name"):
        return {
            "success": False,
            "message": "Name is required"
        }

    if not user_data.get("email"):
        return {
            "success": False,
            "message": "Email is required"
        }

    if not user_data.get("password"):
        return {
            "success": False,
            "message": "Password is required"
        }

    # Check if email already exists
    existing_user = users_collection.find_one(
        {"email": user_data["email"]}
    )

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists"
        }

    # Create a copy of request data
    new_user = user_data.copy()

    # Hash password
    password = new_user["password"].encode("utf-8")
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())

    # Store hashed password
    new_user["password"] = hashed_password.decode("utf-8")

    # Insert into MongoDB
    result = users_collection.insert_one(new_user)

    return {
        "success": True,
        "message": "User created successfully",
        "user_id": str(result.inserted_id)
    }


def login_user(user_data):
    """
    Authenticate user using email and password.
    """

    # Validate required fields
    if not user_data.get("email"):
        return {
            "success": False,
            "message": "Email is required"
        }

    if not user_data.get("password"):
        return {
            "success": False,
            "message": "Password is required"
        }

    # Find user by email
    user = users_collection.find_one(
        {"email": user_data["email"]}
    )

    if not user:
        return {
            "success": False,
            "message": "Invalid email or password"
        }

    # Verify password
    password = user_data["password"].encode("utf-8")
    stored_password = user["password"].encode("utf-8")

    if bcrypt.checkpw(password, stored_password):

        # Generate JWT Token
        token = generate_token(user)

        return {
            "success": True,
            "message": "Login successful",
            "token": token
        }

    return {
        "success": False,
        "message": "Invalid email or password"
    }


def get_profile(user_data):
    """
    Fetch logged-in user's profile.
    """

    user = users_collection.find_one(
        {"_id": ObjectId(user_data["user_id"])}
    )

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    return {
        "success": True,
        "user": {
            "name": user["name"],
            "email": user["email"]
        }
    }