"""
Nexora Production WSGI Server Entry Point (backend/wsgi.py)
Production deployment entry using Waitress / Gunicorn WSGI server.
"""

import os
import sys
import logging

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexora_wsgi")

app = create_app()

def run_production():
    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting Nexora Production WSGI Server on http://{host}:{port}...")
    try:
        from waitress import serve
        serve(app, host=host, port=port)
    except ImportError:
        logger.warning("Waitress not installed. Falling back to default server.")
        app.run(host=host, port=port, debug=False)

if __name__ == "__main__":
    run_production()
