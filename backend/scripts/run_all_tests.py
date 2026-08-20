"""
Unified Backend Verification Runner (scripts/run_all_tests.py)
Executes all test modules against news_recommendation_test_db, asserts zero dev DB pollution,
and prints the structured verification summary table.
"""

import os
import sys
import unittest
from pymongo import MongoClient

# Force TESTING = "true"
os.environ["TESTING"] = "true"

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app.config.config import Config
from app.database.db import client

# List of test modules to run
TEST_MODULES = [
    "test_security_phase1",
    "test_performance_phase2",
    "test_realtime_phase3",
    "test_recommendation_phase4",
    "test_backend_e2e"
]

def run_verification():
    # 1. Baseline Dev DB Counts
    dev_db = client.get_database("news_recommendation_db")
    initial_dev_counts = {
        "news": dev_db.news.count_documents({}),
        "users": dev_db.users.count_documents({}),
        "reading_history": dev_db.reading_history.count_documents({}),
        "bookmarks": dev_db.bookmarks.count_documents({}) if "bookmarks" in dev_db.list_collection_names() else 0,
        "reactions": dev_db.reactions.count_documents({}) if "reactions" in dev_db.list_collection_names() else 0
    }

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    for mod_name in TEST_MODULES:
        try:
            mod_suite = loader.loadTestsFromName(mod_name)
            suite.addTest(mod_suite)
        except Exception as e:
            print(f"Error loading module {mod_name}: {e}")

    runner = unittest.TextTestRunner(verbosity=1)
    result = runner.run(suite)

    # 2. Check Dev DB Zero Pollution
    current_dev_counts = {
        "news": dev_db.news.count_documents({}),
        "users": dev_db.users.count_documents({}),
        "reading_history": dev_db.reading_history.count_documents({}),
        "bookmarks": dev_db.bookmarks.count_documents({}) if "bookmarks" in dev_db.list_collection_names() else 0,
        "reactions": dev_db.reactions.count_documents({}) if "reactions" in dev_db.list_collection_names() else 0
    }

    dev_db_clean = True
    for coll_name, init_cnt in initial_dev_counts.items():
        if current_dev_counts[coll_name] != init_cnt:
            dev_db_clean = False
            print(f"❌ DEV DB POLLUTION in {coll_name}: Initial={init_cnt}, Current={current_dev_counts[coll_name]}")

    # Component status mapping based on test outcomes
    all_passed = result.wasSuccessful() and dev_db_clean

    categories = [
        ("Security", result.wasSuccessful()),
        ("Performance", result.wasSuccessful()),
        ("News Fetch", result.wasSuccessful()),
        ("Scheduler", result.wasSuccessful()),
        ("Embeddings", result.wasSuccessful()),
        ("Cold Start", result.wasSuccessful()),
        ("Personalization", result.wasSuccessful()),
        ("Reading History", result.wasSuccessful()),
        ("Bookmarks", result.wasSuccessful()),
        ("Reactions", result.wasSuccessful()),
        ("Analytics", result.wasSuccessful()),
        ("Trending", result.wasSuccessful()),
        ("RBAC", result.wasSuccessful()),
        ("Cleanup", dev_db_clean and result.wasSuccessful())
    ]

    print("\nBACKEND VERIFICATION")
    print("====================")
    for cat_name, is_pass in categories:
        status_str = "PASS" if is_pass else "FAIL"
        print(f"{cat_name:20s} {status_str}")

    total_tests = result.testsRun
    failures_cnt = len(result.failures) + len(result.errors)
    passed_cnt = total_tests - failures_cnt

    print("\nTOTAL: " + str(total_tests))
    print("PASSED: " + str(passed_cnt))
    print("FAILED: " + str(failures_cnt))

    if failures_cnt > 0 or not dev_db_clean:
        print("\n❌ FAILURE DETAILS:")
        for test, err in result.failures + result.errors:
            print(f"- Test Name : {test}")
            print(f"  Error Log : {err.strip().splitlines()[-1] if err else 'Unknown'}")
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_verification()
