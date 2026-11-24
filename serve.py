#!/usr/bin/env python3
"""Local preview server for the AR Builder site.

Like Python's built-in `http.server`, but it supports HTTP Range requests (206 Partial
Content), which browsers use to stream and loop video. Safari needs this to play video
reliably, and without it Chrome re-downloads whole video files on every loop or seek.
It also stays quiet when the browser cancels a download (normal for video).

Usage:  python3 serve.py [port]        (default port 4173)
"""
import os
import re
import sys
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")
PAGE_RE = re.compile(r"^/(home|about|contact|privacy|terms)/?(\?.*)?$")


class RangeHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        # Local preview: make the browser revalidate every file, so edits show on a normal refresh.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        # Clean page URLs (/home, /about, /contact, ...) serve the site, matching vercel.json.
        if PAGE_RE.match(self.path):
            self.path = "/index.html"
        header = self.headers.get("Range")
        path = self.translate_path(self.path)
        m = RANGE_RE.match(header.strip()) if header else None
        if not m or os.path.isdir(path) or not os.path.isfile(path):
            self._range = None
            return super().send_head()

        size = os.path.getsize(path)
        start_s, end_s = m.groups()
        if start_s == "":  # suffix range: last N bytes
            length = int(end_s or 0)
            start, end = max(0, size - length), size - 1
        else:
            start = int(start_s)
            end = min(int(end_s), size - 1) if end_s else size - 1
        if start >= size or start > end:
            self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        f = open(path, "rb")
        f.seek(start)
        self._range = end - start + 1
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self._range))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        remaining = getattr(self, "_range", None)
        try:
            if remaining is None:
                return super().copyfile(source, outputfile)
            while remaining > 0:
                chunk = source.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # the browser cancelled the download (normal for video) — nothing to report

    def log_message(self, fmt, *args):
        # Keep the terminal readable: only log errors (4xx/5xx).
        if len(args) >= 2 and str(args[1])[:1] in "45":
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    handler = partial(RangeHandler, directory=ROOT)
    server = ThreadingHTTPServer(("", port), handler)
    server.daemon_threads = True
    print(f"AR Builder preview: http://localhost:{port}/  (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
