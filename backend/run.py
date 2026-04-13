import os
import sys
import logging

sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"

    print("\n" + "=" * 50)
    print("  🤖 Preddi API Server")
    print("=" * 50)
    print(f"  Backend:   http://localhost:{port}")
    print(f"  Health:    http://localhost:{port}/api/health")
    print(f"  Debug:     {debug}")
    print("=" * 50 + "\n")

    app.run(host="0.0.0.0", port=port, debug=debug)
