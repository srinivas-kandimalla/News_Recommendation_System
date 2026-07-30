from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from app.models.reaction_model import reaction_collection
from app.models.news_model import news_collection


# ======================================================
# Like News
# ======================================================

def like_news(user_id, news_id):

    return save_reaction(user_id, news_id, "like")


# ======================================================
# Dislike News
# ======================================================

def dislike_news(user_id, news_id):

    return save_reaction(user_id, news_id, "dislike")


# ======================================================
# Save / Update Reaction
# ======================================================

def save_reaction(user_id, news_id, reaction):

    try:
        user_object_id = ObjectId(user_id)
        news_object_id = ObjectId(news_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid ID",
            "status_code": 400
        }

    news = news_collection.find_one({"_id": news_object_id})

    if not news:
        return {
            "success": False,
            "message": "News not found",
            "status_code": 404
        }

    existing = reaction_collection.find_one({
        "user_id": user_object_id,
        "news_id": news_object_id
    })

    if existing:

        if existing["reaction"] == reaction:

            return {
                "success": True,
                "message": f"Already {reaction}d",
                "status_code": 200
            }

        reaction_collection.update_one(
            {
                "_id": existing["_id"]
            },
            {
                "$set": {
                    "reaction": reaction,
                    "reacted_at": datetime.utcnow()
                }
            }
        )

        return {
            "success": True,
            "message": f"Changed reaction to {reaction}",
            "status_code": 200
        }

    reaction_collection.insert_one({
        "user_id": user_object_id,
        "news_id": news_object_id,
        "reaction": reaction,
        "reacted_at": datetime.utcnow()
    })

    return {
        "success": True,
        "message": f"{reaction.capitalize()} added successfully",
        "status_code": 201
    }


# ======================================================
# Get Reactions Count
# ======================================================

def get_reactions(news_id):

    try:
        news_object_id = ObjectId(news_id)

    except InvalidId:
        return {
            "success": False,
            "message": "Invalid News ID",
            "status_code": 400
        }

    likes = reaction_collection.count_documents({
        "news_id": news_object_id,
        "reaction": "like"
    })

    dislikes = reaction_collection.count_documents({
        "news_id": news_object_id,
        "reaction": "dislike"
    })

    return {
        "success": True,
        "likes": likes,
        "dislikes": dislikes,
        "status_code": 200
    }