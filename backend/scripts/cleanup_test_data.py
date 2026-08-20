"""
Standalone Cleanup Script for Synthetic Test Data in Development MongoDB.
REQUIREMENT: Requires explicit '--confirm' flag to execute.
DO NOT run this automatically.
"""

import sys
import argparse
from bson import ObjectId

def cleanup_synthetic_test_data(confirm=False):
    if not confirm:
        print("CANCELLED: Cleanup script requires explicit '--confirm' flag to execute.")
        print("Usage: python scripts/cleanup_test_data.py --confirm")
        return

    # Force TESTING=false so cleanup operates on development database news_recommendation_db
    import os
    os.environ["TESTING"] = "false"

    from app.database.db import (
        news_collection,
        users_collection,
        reading_history_collection,
        bookmark_collection,
        reaction_collection
    )

    print("=" * 60)
    print("🧹 Safe Synthetic Test Data Cleanup Starting...")
    print("=" * 60)

    # 1. Identify synthetic test users
    test_user_query = {
        "$or": [
            {"email": {"$regex": "example\\.com"}},
            {"email": {"$regex": "^phase2_"}},
            {"email": {"$regex": "^coldstart_"}},
            {"email": {"$regex": "^singlehistory_"}},
            {"email": {"$regex": "^diversity_"}},
            {"email": {"$regex": "^unembed_"}},
            {"email": {"$regex": "^live_coldstart_test_"}},
            {"email": "backendtest@ainews.com"},
            {"email": "recommendtest@ainews.com"},
            {"name": {"$in": [
                "Backend Test User",
                "Recommendation Test User",
                "Mass Assignment Tester",
                "Normal User Test",
                "Phase2 User",
                "Cold Start User",
                "Single History User",
                "Diversity User",
                "Unembed User",
                "Live Test User"
            ]}}
        ]
    }
    test_users = list(users_collection.find(test_user_query, {"_id": 1, "email": 1}))
    test_user_ids = [u["_id"] for u in test_users]

    # 2. Identify synthetic test news
    test_news_query = {
        "$or": [
            {"url": {"$regex": "^https?://example\\.com"}},
            {"url": {"$regex": "^custom://news/"}},
            {"title": {"$in": [
                "Tech News 1",
                "Sports News 1",
                "Score Test Article",
                "Article With Failed Embedding",
                "Duplicate Test Article",
                "Older News",
                "Newer News",
                "Unembedded Article Test",
                "Normal Embedded Article",
                "Fresh Zero Engagement Article",
                "Old Article With Interactions"
            ]}},
            {"title": {"$regex": "^Single History Article"}},
            {"title": {"$regex": "^Same Cat Article"}},
            {"title": {"$regex": "^Cold Start Article"}}
        ]
    }
    test_news = list(news_collection.find(test_news_query, {"_id": 1, "title": 1}))
    test_news_ids = [n["_id"] for n in test_news]

    print(f"Found {len(test_users)} synthetic test user(s)")
    print(f"Found {len(test_news)} synthetic test news article(s)")

    # 3. Identify engagement records referencing synthetic test users or news
    engagement_query = {
        "$or": [
            {"user_id": {"$in": test_user_ids}},
            {"news_id": {"$in": test_news_ids}}
        ]
    }

    reads_to_delete = reading_history_collection.count_documents(engagement_query)
    bookmarks_to_delete = bookmark_collection.count_documents(engagement_query)
    reactions_to_delete = reaction_collection.count_documents(engagement_query)

    print(f"Found {reads_to_delete} reading history record(s) to delete")
    print(f"Found {bookmarks_to_delete} bookmark record(s) to delete")
    print(f"Found {reactions_to_delete} reaction record(s) to delete")

    # Perform deletion
    res_reads = reading_history_collection.delete_many(engagement_query)
    res_bookmarks = bookmark_collection.delete_many(engagement_query)
    res_reactions = reaction_collection.delete_many(engagement_query)
    res_news = news_collection.delete_many(test_news_query)
    res_users = users_collection.delete_many(test_user_query)

    print("=" * 60)
    print("✅ Cleanup Summary:")
    print(f"Deleted Users     : {res_users.deleted_count}")
    print(f"Deleted News      : {res_news.deleted_count}")
    print(f"Deleted Reads     : {res_reads.deleted_count}")
    print(f"Deleted Bookmarks : {res_bookmarks.deleted_count}")
    print(f"Deleted Reactions : {res_reactions.deleted_count}")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean synthetic test data from MongoDB dev database.")
    parser.add_argument("--confirm", action="store_true", help="Confirm execution of cleanup script.")
    args = parser.parse_args()

    cleanup_synthetic_test_data(confirm=args.confirm)
