import os
import sys
import time
import socket
import atexit
import subprocess
import uvicorn
from app.config.env import settings

ml_process = None


def is_port_in_use(port: int) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(("127.0.0.1", port)) == 0
    except Exception:
        return False


def start_ml_service():
    global ml_process
    if is_port_in_use(8000):
        print("[BuyerDNA] Python ML Microservice is already active on port 8000.")
        return

    ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml-service")
    if not os.path.isdir(ml_dir):
        print(f"[BuyerDNA] Warning: ML service directory not found at {ml_dir}")
        return

    print("\n" + "=" * 65)
    print(" [BuyerDNA] Auto-launching Python ML Service on http://127.0.0.1:8000...")
    print("=" * 65)
    try:
        # Launch ML service inheriting stdout/stderr so logs appear in this terminal
        ml_process = subprocess.Popen(
            [sys.executable, "-u", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=ml_dir,
        )
        time.sleep(1.5)
        print(f"[BuyerDNA] ML Microservice initialized successfully (PID: {ml_process.pid}).\n")
    except Exception as e:
        print(f"[BuyerDNA] Could not start ML service automatically: {e}\n")


def cleanup_ml_service():
    global ml_process
    if ml_process and ml_process.poll() is None:
        print("\n[BuyerDNA] Gracefully terminating Python ML Microservice...")
        try:
            ml_process.terminate()
            ml_process.wait(timeout=2)
        except Exception:
            try:
                ml_process.kill()
            except Exception:
                pass


atexit.register(cleanup_ml_service)

if __name__ == "__main__":
    start_ml_service()
    print("=" * 65)
    print(f" BuyerDNA Backend API running on http://localhost:{settings.PORT}")
    print(f" Backend Swagger Docs : http://localhost:{settings.PORT}/docs")
    print(f" ML Microservice Docs : http://localhost:8000/docs")
    print("=" * 65 + "\n")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=False,
        log_level="info",
    )

