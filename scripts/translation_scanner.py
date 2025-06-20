import json
from pathlib import Path

LOCAL_PATH = Path("./frontend/public/locales")
LANGUAGES = ["en", "de"]


def sort_translation_files():
    if not LOCAL_PATH.is_dir():
        print(f"Local Path: {LOCAL_PATH} does not exists, skip sort translation files")
        return

    for lang_dir in LOCAL_PATH.iterdir():
        if lang_dir.is_dir():
            for file_path in lang_dir.iterdir():
                with open(file_path, "r") as f:
                    translations = json.load(f)

                with open(file_path, "w") as f:
                    print(f"write file_path: {file_path}")
                    json.dump(translations, f, indent=4, sort_keys=True)


def main():
    sort_translation_files()


if __name__ == "__main__":
    main()
