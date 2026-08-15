#!/usr/bin/env python3
"""
Bejacastle - Story-Driven Retro Horror Exploration Server
Supports FastAPI with Uvicorn, with a built-in standard library fallback.
"""

import json
import os
import sys
from pathlib import Path

PORT = int(os.environ.get("PORT", 8001))
HOST = os.environ.get("HOST", "0.0.0.0")
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
HIGHSCORES_FILE = DATA_DIR / "scores.json"
SAVES_FILE = DATA_DIR / "saves.json"

DEFAULT_SCORES = [
    {"name": "SCHATTEN_JAEGER", "timeSec": 245, "ending": "Erlösung", "sanity": 85, "date": "2026-08-15"},
    {"name": "WALD_WANDERER", "timeSec": 310, "ending": "Flucht", "sanity": 60, "date": "2026-08-14"},
    {"name": "GRAF_BEJA", "timeSec": 420, "ending": "Schattenerbe", "sanity": 20, "date": "2026-08-13"},
]


def load_scores():
    if not HIGHSCORES_FILE.exists():
        save_scores(DEFAULT_SCORES)
        return DEFAULT_SCORES
    try:
        with open(HIGHSCORES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_SCORES


def save_scores(scores):
    try:
        with open(HIGHSCORES_FILE, "w", encoding="utf-8") as f:
            json.dump(scores, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving scores: {e}", file=sys.stderr)


def load_saves():
    if not SAVES_FILE.exists():
        return {}
    try:
        with open(SAVES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_game_state(slot, state):
    try:
        saves = load_saves()
        saves[str(slot)] = state
        with open(SAVES_FILE, "w", encoding="utf-8") as f:
            json.dump(saves, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving game state: {e}", file=sys.stderr)
        return False


# Try using FastAPI if installed
try:
    from fastapi import FastAPI, Request
    from fastapi.responses import FileResponse, JSONResponse
    from fastapi.staticfiles import StaticFiles
    import uvicorn

    app = FastAPI(title="Bejacastle Server", version="1.0.0")

    @app.get("/api/health")
    async def health_check():
        return {"status": "ok", "app": "bejacastle", "version": "1.0.0"}

    @app.get("/api/scores")
    async def get_scores():
        return load_scores()

    @app.post("/api/scores")
    async def add_score(request: Request):
        try:
            body = await request.json()
            name = str(body.get("name", "ANONYMOUS"))[:14].upper()
            time_sec = int(body.get("timeSec", 0))
            ending = str(body.get("ending", "Flucht"))
            sanity = int(body.get("sanity", 50))
            date = str(body.get("date", ""))

            scores = load_scores()
            scores.append({
                "name": name,
                "timeSec": time_sec,
                "ending": ending,
                "sanity": sanity,
                "date": date
            })
            scores = sorted(scores, key=lambda x: (x.get("timeSec", 999999), -x.get("sanity", 0)))[:20]
            save_scores(scores)
            return {"status": "success", "scores": scores}
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": str(e)})

    @app.get("/api/save/{slot}")
    async def get_save(slot: str):
        saves = load_saves()
        return saves.get(slot, {})

    @app.post("/api/save/{slot}")
    async def post_save(slot: str, request: Request):
        try:
            body = await request.json()
            success = save_game_state(slot, body)
            return {"status": "success" if success else "error"}
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": str(e)})

    # Mount static files
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

    def run_fastapi():
        print(f"==================================================")
        print(f"  🏰  BEJACASTLE - SPUK-SCHLOSS SERVER")
        print(f"  🚀  FastAPI Server läuft auf http://localhost:{PORT}")
        print(f"  👉  Öffne deinen Browser und wage den Schritt in den Wald!")
        print(f"==================================================")
        uvicorn.run(app, host=HOST, port=PORT, log_level="info")

    USE_FASTAPI = True

except ImportError:
    USE_FASTAPI = False


def run_stdlib_server():
    import http.server
    import socketserver
    import urllib.parse

    class BejacastleHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

        def do_GET(self):
            parsed_path = urllib.parse.urlparse(self.path)
            if parsed_path.path == "/api/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "app": "bejacastle", "backend": "stdlib"}).encode())
                return
            elif parsed_path.path == "/api/scores":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(load_scores()).encode())
                return
            elif parsed_path.path.startswith("/api/save/"):
                slot = parsed_path.path.replace("/api/save/", "")
                saves = load_saves()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(saves.get(slot, {})).encode())
                return
            super().do_GET()

        def do_POST(self):
            parsed_path = urllib.parse.urlparse(self.path)
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            if parsed_path.path == "/api/scores":
                try:
                    data = json.loads(body.decode('utf-8'))
                    name = str(data.get("name", "ANONYMOUS"))[:14].upper()
                    time_sec = int(data.get("timeSec", 0))
                    ending = str(data.get("ending", "Flucht"))
                    sanity = int(data.get("sanity", 50))
                    date = str(data.get("date", ""))
                    scores = load_scores()
                    scores.append({
                        "name": name,
                        "timeSec": time_sec,
                        "ending": ending,
                        "sanity": sanity,
                        "date": date
                    })
                    scores = sorted(scores, key=lambda x: (x.get("timeSec", 999999), -x.get("sanity", 0)))[:20]
                    save_scores(scores)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success", "scores": scores}).encode())
                    return
                except Exception as e:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode())
                    return

            elif parsed_path.path.startswith("/api/save/"):
                slot = parsed_path.path.replace("/api/save/", "")
                try:
                    data = json.loads(body.decode('utf-8'))
                    success = save_game_state(slot, data)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success" if success else "error"}).encode())
                    return
                except Exception as e:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode())
                    return

            self.send_response(404)
            self.end_headers()

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    print(f"==================================================")
    print(f"  🏰  BEJACASTLE - SPUK-SCHLOSS SERVER")
    print(f"  🚀  Python HTTP Server läuft auf http://localhost:{PORT}")
    print(f"  👉  Öffne deinen Browser und wage den Schritt in den Wald!")
    print(f"==================================================")
    with ReusableTCPServer((HOST, PORT), BejacastleHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer beendet.")


if __name__ == "__main__":
    if USE_FASTAPI:
        run_fastapi()
    else:
        run_stdlib_server()
