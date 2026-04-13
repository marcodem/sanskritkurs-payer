#!/Users/marco/.pyenv/shims/python3
import pathlib
import sys

def convert_file(path: pathlib.Path):
    if not path.is_file():
        print(f"Überspringe (kein File): {path}")
        return

    raw = path.read_bytes()

    # Schon UTF-8? Dann nichts tun
    try:
        raw.decode("utf-8")
        print(f"Überspringe (schon UTF-8): {path.name}")
        return
    except UnicodeDecodeError:
        pass

    try:
        text_latin1 = raw.decode("latin_1")
    except UnicodeDecodeError:
        print(f"Kann {path.name} nicht als Latin-1 dekodieren, überspringe.")
        return

    fixed = (text_latin1
             .replace('charset=windows-1252', 'charset=utf-8')
             .replace('charset=iso-8859-1', 'charset=utf-8'))

    path.write_text(fixed, encoding="utf-8")
    print(f"Konvertiert nach UTF-8: {path.name}")

def main():
    root = pathlib.Path(".")

    if len(sys.argv) > 1:
        # Einzeldatei aus Argument
        target = root / sys.argv[1]
        convert_file(target)
    else:
        # Alle *.htm im aktuellen Ordner
        for f in root.glob("*.htm"):
            convert_file(f)

if __name__ == "__main__":
    main()
