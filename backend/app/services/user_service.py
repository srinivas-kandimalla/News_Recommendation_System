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

    if len(user_data["password"]) < 8:
        return {
            "success": False,
            "message": "Password must be at least 8 characters long"
        }

    email = user_data["email"].strip().lower()

    # Check if email already exists
    existing_user = users_collection.find_one(
        {"email": email}
    )

    if existing_user:
        return {
            "success": False,
            "message": "Email already exists"
        }

    # Hash password
    password = user_data["password"].encode("utf-8")
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode("utf-8")

    # Construct explicit user object to prevent mass assignment vulnerability
    new_user = {
        "name": user_data["name"].strip(),
        "email": email,
        "password": hashed_password,
        "role": "user"
    }

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

    email = user_data["email"].strip().lower()

    # Find user by email
    user = users_collection.find_one(
        {"email": email}
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
    if isinstance(user_data, dict):
        user_id = user_data.get("_id") or user_data.get("user_id")
    else:
        user_id = user_data

    if isinstance(user_id, str):
        try:
            user_id = ObjectId(user_id)
        except Exception:
            pass

    user = users_collection.find_one({"_id": user_id})

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    return {
        "success": True,
        "user": {
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", "user")
        }
    }


def reset_password(user_data):
    """
    Reset user password by email.
    """
    if not user_data.get("email"):
        return {
            "success": False,
            "message": "Email is required"
        }

    if not user_data.get("new_password"):
        return {
            "success": False,
            "message": "New password is required"
        }

    if len(user_data["new_password"]) < 8:
        return {
            "success": False,
            "message": "New password must be at least 8 characters long"
        }

    email = user_data["email"].strip().lower()

    user = users_collection.find_one({"email": email})
    if not user:
        return {
            "success": False,
            "message": "No account found with this email address"
        }

    password = user_data["new_password"].encode("utf-8")
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode("utf-8")

    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )

    return {
        "success": True,
        "message": "Password reset successfully. You can now sign in with your new password."
    }