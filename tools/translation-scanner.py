#!/usr/bin/env python3
"""Add the translation keys the frontend uses to its locale files.

Usage: translation-scanner.py [-r | --remove-unused]

Scans every source file once and adds each missing key to the namespace's file
of every language, with the key itself as placeholder text. A source file binds
at most two namespaces:
    const [t] = useTranslation("namespace") -> its page namespace
    const [tg] = useTranslation()           -> the general namespace

-r, --remove-unused: also removes the keys no source file uses
"""

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCAL_DIR = ROOT / "frontend" / "public" / "locales"
SRC_DIR = ROOT / "frontend" / "src"
LANGUAGES = ["en", "de"]
SCAN_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"]
GLOBAL_NAMESPACE = "translation"


class TranslationHandler:
    """
    Collects the keys the source files use and writes them into the locale files.

    Every namespace gets one file per language; a namespace missing in one
    language's directory is created there.
    """

    LOCAL_NAMESPACE_PATTERN = re.compile(r'useTranslation\("([^"]+)"\)')
    GLOBAL_NAMESPACE_PATTERN = re.compile(r"useTranslation\(\)")
    LOCAL_KEY_PATTERN = re.compile(
        r't\(\s*"([^."]+)\.([^\s",)]+)"(?:\s*,\s*\{[^}]*\})?\s*\)'
    )
    GLOBAL_KEY_PATTERN = re.compile(
        r'tg\(\s*"([^."]+)\.([^\s",)]+)"(?:\s*,\s*\{[^}]*\})?\s*\)'
    )

    def __init__(self):
        self.namespaces = set()
        self.translations = {}
        self.set_existing_namespaces()

    def set_existing_namespaces(self):
        """
        Registers the namespaces that already have a file in any language and
        creates the files a language is missing.
        """
        if not LOCAL_DIR.exists():
            print(f"Error: {LOCAL_DIR} does not exist, please create it")
            return

        namespaces_by_language = {}
        for lang_dir in LOCAL_DIR.iterdir():
            if lang_dir.is_dir() and lang_dir.name in LANGUAGES:
                namespaces_by_language[lang_dir.name] = {file.stem for file in lang_dir.glob("*.json")}

        for namespaces in namespaces_by_language.values():
            self.namespaces |= namespaces

        for namespaces in namespaces_by_language.values():
            for namespace in self.namespaces - namespaces:
                self.create_translation_file(namespace)

    def process_file(self, file_path):
        """
        Adds the keys one source file uses to the files of its namespaces.

        :param file_path: The source file to scan
        """
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if (
            TranslationHandler.GLOBAL_NAMESPACE_PATTERN.search(content)
            and GLOBAL_NAMESPACE not in self.namespaces
        ):
            self.create_translation_file(GLOBAL_NAMESPACE)

        local_namespaces = TranslationHandler.LOCAL_NAMESPACE_PATTERN.findall(content)
        for namespace in local_namespaces:
            if namespace == "":
                print(
                    "Error: local namespace can not be empty, probably meant to use the global namespace",
                    f"| file: {file_path}",
                )
            if namespace and namespace not in self.namespaces:
                self.create_translation_file(namespace)

        if len(local_namespaces) > 1:
            if len(set(local_namespaces)) == 1:
                local_namespaces = [local_namespaces[0]]
            else:
                print(
                    f"Error: can only be one local namespace: {local_namespaces}",
                    f"| file: {file_path}",
                )
                return

        try:
            patterns = TranslationHandler.LOCAL_KEY_PATTERN.findall(content)
            if patterns and len(local_namespaces) == 1:
                self.update_translation_file(local_namespaces[0], patterns)
            elif patterns:
                print(
                    "Error: found local translation without local namespace, probably meant to use the global namespace [tg]",
                    f"| file: {file_path}",
                )
        except Exception as e:
            print(f"Error: {e}", f"| file: {file_path}")

        global_patterns = TranslationHandler.GLOBAL_KEY_PATTERN.findall(content)
        if global_patterns and GLOBAL_NAMESPACE in self.namespaces:
            self.update_translation_file(GLOBAL_NAMESPACE, global_patterns)

    def add_translations_of_namespace(self, namespace, patterns):
        """
        Records the keys a namespace uses.

        :param namespace: The namespace the keys belong to
        :param patterns: The keys, as `(category, slug)` pairs
        """
        self.translations.setdefault(namespace, set()).update(patterns)

    def create_translation_file(self, file_name):
        """
        Creates an empty file for a namespace in every language that lacks it.

        :param file_name: The namespace to create
        """
        print("create namespace:", file_name)
        for lang_dir in LOCAL_DIR.iterdir():
            file_path = lang_dir / f"{file_name}.json"
            if not file_path.exists():
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump({}, f, indent=4, sort_keys=True)

    def update_translation_file(self, namespace, patterns):
        """
        Adds the keys missing from a namespace's file in every language.

        :param namespace: The namespace to update
        :param patterns: The keys, as `(category, slug)` pairs
        """
        self.add_translations_of_namespace(namespace, patterns)
        for lang_dir in LOCAL_DIR.iterdir():
            file_path = lang_dir / f"{namespace}.json"
            if not file_path.exists():
                continue

            with open(file_path, "r", encoding="utf-8") as f:
                content = json.load(f)

            for pattern in patterns:
                if len(pattern) == 2:
                    key, inner_key = pattern
                    if key not in content or not isinstance(content[key], dict):
                        content[key] = {}
                    if inner_key not in content[key]:
                        print(f"{lang_dir.name}/{file_path.name} -- add: {key}.{inner_key}")
                        content[key][inner_key] = f"{key}.{inner_key}"
                else:
                    key = pattern[0]
                    if key not in content or not isinstance(content[key], dict):
                        print(f"{lang_dir.name}/{file_path.name} -- add: {key}")
                        content[key] = f"{key}"

            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(content, f, indent=4, sort_keys=True)

    def remove_not_used_translations(self):
        """
        Removes the keys no source file uses, and categories left empty by that.
        """
        for lang_dir in LOCAL_DIR.iterdir():
            if not (lang_dir.is_dir() and lang_dir.name in LANGUAGES):
                continue

            for file in lang_dir.iterdir():
                if file.stem not in self.translations:
                    print(
                        "Warn: for this namespace no translations were found in the code space",
                        f"| file: {file}",
                    )
                    continue

                with open(file, "r", encoding="utf-8") as f:
                    content = json.load(f)

                file_set = set()
                for key in content:
                    if type(content[key]) is str:
                        file_set.add((key, None))
                    elif type(content[key]) is dict:
                        for inner_key in content[key]:
                            file_set.add((key, inner_key))

                for key, inner_key in file_set - self.translations[file.stem]:
                    if inner_key is None:
                        print(f"{lang_dir.name}/{file.name} -- remove: {key}")
                        del content[key]
                    else:
                        print(f"{lang_dir.name}/{file.name} -- remove: {key}.{inner_key}")
                        del content[key][inner_key]

                for key in [key for key, value in content.items() if type(value) is dict and len(value) == 0]:
                    del content[key]

                with open(file, "w", encoding="utf-8") as f:
                    json.dump(content, f, indent=4, sort_keys=True)


def scan_existing_files():
    """
    Runs every source file through a new handler.

    :return: The handler, holding every key the source files use
    """
    handler = TranslationHandler()

    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if any(file.endswith(ex) for ex in SCAN_EXTENSIONS):
                handler.process_file(os.path.join(root, file))

    return handler


def sort_translation_files():
    """
    Rewrites every locale file with its keys sorted.
    """
    if not LOCAL_DIR.is_dir():
        print(f"Local Path: {LOCAL_DIR} does not exist, skip sort translation files")
        return

    for lang_dir in LOCAL_DIR.iterdir():
        if lang_dir.is_dir() and lang_dir.name in LANGUAGES:
            for file_path in lang_dir.iterdir():
                with open(file_path, "r", encoding="utf-8") as f:
                    translations = json.load(f)

                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(translations, f, indent=4, sort_keys=True)


def main():
    if any(arg in ("--help", "-h") for arg in sys.argv):
        print(__doc__)
        return

    print(f"Scanning {SRC_DIR} into {LOCAL_DIR} ({', '.join(LANGUAGES)})")

    handler = scan_existing_files()
    sort_translation_files()

    if any(arg in ("--remove-unused", "-r") for arg in sys.argv):
        handler.remove_not_used_translations()

    print("Translation scanning completed.")


if __name__ == "__main__":
    main()
