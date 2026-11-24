"""Serve only the demo assets on the local network."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
ASSETS = {"/", "/index.html", "/app.js", "/style.css", "/lake.jpg"}


class DemoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        if urlsplit(self.path).path not in ASSETS:
            self.send_error(404)
            return None
        return super().send_head()


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8765), DemoHandler).serve_forever()
