import sys
import os
import traceback

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

log_path = os.path.join(backend_dir, "server.log")

def log(msg):
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
        f.flush()

log("1. Script started with HF_HUB_OFFLINE=1")
try:
    log("2. Importing create_app...")
    from app import create_app
    log("3. Creating app...")
    app = create_app()
    log("4. App created successfully! Starting Flask server on 127.0.0.1:5000...")
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
except Exception as e:
    log(f"ERROR: {e}")
    log(traceback.format_exc())
