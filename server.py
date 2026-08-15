#!/usr/bin/env python3
"""
Bejacastle - Realistic 2.5D Gothic Horror Exploration Server
Supports multi-slot local JSON save files, highscores, and FastAPI/stdlib dual backends.
"""

import json
import os
import sys
import time
from pathlib import Path

PORT = int(os.environ.get("PORT", 8001))
HOST = os.environ.get("HOST", "0.0.0.0")
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
SAVES_DIR = DATA_DIR / "saves"
DATA_DIR.mkdir(exist_ok=True)
SAVES_DIR.mkdir(exist_ok=True)
HIGHSCORES_FILE = DATA_DIR / "scores.json"

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


def get_save_path(slot_id: str) -> Path:
    safe_slot = "".join(c for c in slot_id if c.isalnum() or c in ("-", "_")).lower()
    if not safe_slot:
        safe_slot = "auto"
    return SAVES_DIR / f"{safe_slot}.json"


def list_saves():
    saves_list = []
    if not SAVES_DIR.exists():
        return saves_list

    for file_path in SAVES_DIR.glob("*.json"):
        slot_name = file_path.stem
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                saves_list.append({
                    "slot": slot_name,
                    "title": data.get("title", f"Spielstand {slot_name}"),
                    "chapterName": data.get("chapterName", "Kapitel I"),
                    "chapterIndex": data.get("chapterIndex", 0),
                    "sanity": data.get("sanity", 100),
                    "gameTimeSec": data.get("gameTimeSec", 0),
                    "inventory": data.get("inventory", []),
                    "timestamp": data.get("timestamp", time.strftime("%Y-%m-%d %H:%M:%S")),
                    "modified": file_path.stat().st_mtime
                })
        except Exception as e:
            print(f"Error reading save file {file_path}: {e}", file=sys.stderr)

    # Sort newest first
    return sorted(saves_list, key=lambda x: x.get("modified", 0), reverse=True)


def load_save_file(slot_id: str):
    path = get_save_path(slot_id)
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading save file {path}: {e}", file=sys.stderr)
        return None


def write_save_file(slot_id: str, data: dict):
    path = get_save_path(slot_id)
    try:
        if "timestamp" not in data:
            data["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving to {path}: {e}", file=sys.stderr)
        return False


def delete_save_file(slot_id: str):
    path = get_save_path(slot_id)
    if path.exists():
        try:
            path.unlink()
            return True
        except Exception:
            return False
    return False


def get_codebase_version() -> float:
    """Returns the highest modification timestamp of codebase files (.js, .css, .html, .py)."""
    max_mtime = 0.0
    try:
        if Path(__file__).exists():
            max_mtime = max(max_mtime, Path(__file__).stat().st_mtime)
        if STATIC_DIR.exists():
            for p in STATIC_DIR.rglob("*"):
                if p.is_file() and not p.name.startswith(".") and not p.suffix == ".swp":
                    max_mtime = max(max_mtime, p.stat().st_mtime)
    except Exception:
        pass
    return max_mtime


# Try using FastAPI if installed
try:
    from fastapi import FastAPI, Request
    from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
    from fastapi.staticfiles import StaticFiles
    import asyncio
    import uvicorn

    app = FastAPI(title="Bejacastle 2.5D Gothic Server", version="2.0.0")

    @app.get("/api/health")
    async def health_check():
        return {"status": "ok", "app": "bejacastle", "version": "2.0.0", "style": "2.5D Realistic"}

    @app.get("/api/code-version")
    async def get_version():
        return {"version": get_codebase_version()}

    @app.get("/api/live-reload")
    async def live_reload_sse(request: Request):
        async def event_generator():
            last_version = get_codebase_version()
            while True:
                if await request.is_disconnected():
                    break
                await asyncio.sleep(0.3)
                curr_version = get_codebase_version()
                if curr_version > last_version:
                    last_version = curr_version
                    yield "data: reload\n\n"
                else:
                    yield ": ping\n\n"
        return StreamingResponse(event_generator(), media_type="text/event-stream")

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

    @app.get("/api/saves")
    async def get_all_saves():
        return list_saves()

    @app.get("/api/save/{slot_id}")
    async def get_save(slot_id: str):
        data = load_save_file(slot_id)
        if data is None:
            return JSONResponse(status_code=404, content={"error": "Save not found"})
        return data

    @app.post("/api/save/{slot_id}")
    async def post_save(slot_id: str, request: Request):
        try:
            body = await request.json()
            success = write_save_file(slot_id, body)
            return {"status": "success" if success else "error", "slot": slot_id}
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": str(e)})

    @app.delete("/api/save/{slot_id}")
    async def delete_save(slot_id: str):
        success = delete_save_file(slot_id)
        return {"status": "success" if success else "error", "deleted": success}

    # Mount static files
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

    def run_fastapi():
        print(f"==================================================")
        print(f"  🏰  BEJACASTLE - 2.5D GOTHIC HORROR SERVER")
        print(f"  🚀  FastAPI Server läuft auf http://localhost:{PORT}")
        print(f"  💾  Lokales JSON-Speichersystem aktiv in {SAVES_DIR}")
        print(f"  🔄  Codebase Hot-Reload & Browser-Sync aktiv")
        print(f"==================================================")
        uvicorn.run("server:app", host=HOST, port=PORT, reload=True, reload_dirs=[str(BASE_DIR)], log_level="info")

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
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == "/api/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "app": "bejacastle", "backend": "stdlib"}).encode())
                return
            elif parsed.path == "/api/code-version":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"version": get_codebase_version()}).encode())
                return
            elif parsed.path == "/api/scores":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(load_scores()).encode())
                return
            elif parsed.path == "/api/saves":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(list_saves()).encode())
                return
            elif parsed.path.startswith("/api/save/"):
                slot_id = parsed.path.replace("/api/save/", "")
                data = load_save_file(slot_id)
                if data is None:
                    self.send_response(404)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Save not found"}).encode())
                else:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps(data).encode())
                return
            super().do_GET()

        def do_POST(self):
            parsed = urllib.parse.urlparse(self.path)
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)

            if parsed.path == "/api/scores":
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

            elif parsed.path.startswith("/api/save/"):
                slot_id = parsed.path.replace("/api/save/", "")
                try:
                    data = json.loads(body.decode('utf-8'))
                    success = write_save_file(slot_id, data)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success" if success else "error", "slot": slot_id}).encode())
                    return
                except Exception as e:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode())
                    return

            self.send_response(404)
            self.end_headers()

        def do_DELETE(self):
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path.startswith("/api/save/"):
                slot_id = parsed.path.replace("/api/save/", "")
                success = delete_save_file(slot_id)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success" if success else "error", "deleted": success}).encode())
                return
            self.send_response(404)
            self.end_headers()

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    print(f"==================================================")
    print(f"  🏰  BEJACASTLE - 2.5D GOTHIC HORROR SERVER")
    print(f"  🚀  Python HTTP Server läuft auf http://localhost:{PORT}")
    print(f"  💾  Lokales JSON-Speichersystem aktiv in {SAVES_DIR}")
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
