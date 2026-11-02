"""Generates the PWA icons (an atom on an indigo gradient) as PNG files.

Run from the project root:  python3 tools/generate-icons.py
Uses only the standard library so the icons can be rebuilt without extra tooling.
"""
import math
import struct
import zlib
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent.parent / "public" / "icons"
TOP = (89, 107, 224)      # #596be0
BOTTOM = (60, 72, 160)
WHITE = (255, 255, 255)
ACCENT = (255, 205, 96)
SUPERSAMPLE = 3


def ring_coverage(x, y, angle, a, b, width):
    """1.0 inside an elliptical ring centred at the origin, rotated by `angle`."""
    c, s = math.cos(angle), math.sin(angle)
    u, v = x * c + y * s, -x * s + y * c
    f = math.hypot(u / a, v / b)
    return 1.0 if abs(f - 1.0) * (a + b) / 2 <= width / 2 else 0.0


def render(size, content_scale):
    pixels = bytearray()
    half = size / 2
    unit = size * content_scale / 2  # radius of the atom's outer extent
    a, b = unit, unit * 0.36
    width = size * 0.032 * content_scale / 0.8
    nucleus = unit * 0.2
    for py in range(size):
        pixels.append(0)  # PNG filter type: none
        for px in range(size):
            t = py / (size - 1)
            base = tuple(TOP[i] + (BOTTOM[i] - TOP[i]) * t for i in range(3))
            r = g = bl = 0.0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    x = px + (sx + 0.5) / SUPERSAMPLE - half
                    y = py + (sy + 0.5) / SUPERSAMPLE - half
                    colour = base
                    if any(ring_coverage(x, y, k * math.pi / 3, a, b, width) for k in range(3)):
                        colour = WHITE
                    if math.hypot(x, y) <= nucleus:
                        colour = ACCENT
                    r += colour[0]
                    g += colour[1]
                    bl += colour[2]
            n = SUPERSAMPLE * SUPERSAMPLE
            pixels += bytes((round(r / n), round(g / n), round(bl / n)))
    return bytes(pixels)


def png(size, content_scale):
    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(render(size, content_scale), 9))
        + chunk(b"IEND", b"")
    )


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # "any" icons use most of the canvas; maskable icons keep content inside the 80% safe zone.
    for name, size, scale in [
        ("icon-192.png", 192, 0.82),
        ("icon-512.png", 512, 0.82),
        ("icon-maskable-512.png", 512, 0.6),
        ("apple-touch-icon.png", 180, 0.7),
    ]:
        (OUTPUT / name).write_bytes(png(size, scale))
        print("wrote", OUTPUT / name)
