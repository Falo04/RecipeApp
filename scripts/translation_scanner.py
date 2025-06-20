import time
import sys
import os
import re
import json
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from colorama import Fore, Back, Style, init

"""
This module provides a basic translation scanner to scan source files
and create translation files based on specified languages.

It supports only two namespaces in one file, e.g:
const [t] = useTranslation("namespace") -> local namespace
const [tg] = useTranslation("namespace") -> global namespace
"""

### Local Variables ###
LOCAL_DIR = Path("./frontend/public/locales")
SRC_DIR = Path("./frontend/src")
LANGUAGES = ["en", "de"]
SCAN_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"]
GLOBAL_NAMESPACE = "translation"

### Regex ###
LOCAL_NAMESPACE_PATTERN = re.compile(r'useTranslation\("([^"]+)"\)')
GLOBAL_NAMESPACE_PATTERN = re.compile(r"useTranslation\(\)")
LOCAL_TRANSLATION = re.compile(r't\("([^"]+)"\)')
LOCAL_KEY_PATTERN = re.compile(r't\("([^.]+)[.]([^"]+)"\)')
GLOBAL_KEY_PATTERN = re.compile(r'tg\("([^.]+)[.]([^"]+)"\)')


class TranslationHandler:
    """
    This class handles the creation and updating of translation files.
    It scans a directory of language-specific JSON files and ensures that
    all keys from a global namespace and any local namespaces are present
    in their respective language files.
    """

    def __init__(self):
        self.namespaces = set()
        self.translations = {}
        self.set_existing_namespaces()

    def set_existing_namespaces(self):
        """
        Adds all existing namespaces to this translation handler.
        If the namespaces differ in the language directory, the namespace will be created.
        :return:
        """
        if not LOCAL_DIR.exists():
            return

        hashset_dict = dict()

        for lang_dir in LOCAL_DIR.iterdir():
            if lang_dir.is_dir() and lang_dir.name in LANGUAGES:
                hash_set = set()
                for file in lang_dir.glob("*.json"):
                    hash_set.add(file.stem)
                hashset_dict.update({lang_dir.name: hash_set})

        for hashset in hashset_dict.values():
            self.namespaces = self.namespaces.union(hashset)

        for hashset in hashset_dict.values():
            difference = self.namespaces.difference(hashset)
            for dif in difference:
                self.create_translation_file(dif)

    def process_file(self, file_path):
        """
        It loads the file and searches the local and the global namespace.
        If one or both namespaces are present in the file, it searches for all
        key patterns adds them to the namespace-specific translation file.
        :param file_path: The name of the file to process
        :return:
        """
        with open(file_path, "r") as f:
            content = f.read()

        # check for global namespace
        if (
            GLOBAL_NAMESPACE_PATTERN.search(content)
            and GLOBAL_NAMESPACE not in self.namespaces
        ):
            self.create_translation_file(GLOBAL_NAMESPACE)

        # check all local namespaces
        local_namespaces = LOCAL_NAMESPACE_PATTERN.findall(content)
        for namespace in local_namespaces:
            if namespace and namespace not in self.namespaces:
                self.create_translation_file(namespace)

        for namespace in local_namespaces:
            if namespace:
                patterns = LOCAL_KEY_PATTERN.findall(content)
                self.update_translation_file(namespace, patterns)
                self.add_translations_of_namespace(namespace, patterns)

        global_patterns = GLOBAL_KEY_PATTERN.findall(content)
        if global_patterns and GLOBAL_NAMESPACE in self.namespaces:
            self.add_translations_of_namespace(GLOBAL_NAMESPACE, global_patterns)
            self.update_translation_file(GLOBAL_NAMESPACE, global_patterns)

    def add_translations_of_namespace(self, namespace, patterns):
        """
        Adds all patterns of a namespace to the dictionary of the class.
        :param namespace: The namespace to add the patterns to.
        :param patterns: The patterns to add.
        :return:
        """
        if namespace not in self.translations:
            self.translations[namespace] = set()
        for pattern in patterns:
            self.translations[namespace].add(pattern)

    def create_translation_file(self, file_name):
        """
        :param file_name: The name of the file to create
        :return:
        """
        print(Fore.BLUE + "create namespace: ", file_name)
        for lang_dir in LOCAL_DIR.iterdir():
            file_path = Path(f"{lang_dir}/{file_name}.json")
            if not file_path.exists():
                with open(file_path, "w") as f:
                    json.dump({}, f, indent=4, sort_keys=True)

    def update_translation_file(self, namespace, patterns):
        """
        Loads the namespace-specific translation file and updates it.
        :param namespace: The namespace to update
        :param patterns: All patterns to add to translation files
        :return:
        """
        for lang_dir in LOCAL_DIR.iterdir():
            file_path = lang_dir / f"{namespace}.json"
            if file_path.exists():
                for pattern in patterns:
                    with open(file_path, "r") as f:
                        content = json.load(f)

                    if len(pattern) == 2:
                        key = pattern[0]
                        inner_key = pattern[1]

                        # Ensure the outer key exists
                        if key not in content or not isinstance(content[key], dict):
                            content[key] = {}

                        # Add the new token
                        if inner_key not in content[key]:
                            print(
                                Fore.LIGHTGREEN_EX
                                + f"{lang_dir.name}/{file_path.name} | add: {key}.{inner_key}"
                            )
                            content[key][inner_key] = f"{key}.{inner_key}"
                    else:
                        key = pattern[0]
                        if key not in content or not isinstance(content[key], dict):
                            print(
                                Fore.LIGHTGREEN_EX
                                + f"{lang_dir.name}/{file_path.name} | add: {key}"
                            )
                            content[key] = f"{key}"

                    with open(file_path, "w") as f:
                        json.dump(content, f, indent=4, sort_keys=True)

    def remove_not_used_translations(self):
        """
        Removes all unused translations.
        :return:
        """
        for lang_dir in LOCAL_DIR.iterdir():
            if lang_dir.is_dir() and lang_dir.name in LANGUAGES:
                for file in lang_dir.iterdir():
                    file_set = set()
                    with open(file, "r") as f:
                        content = json.load(f)

                    for key in content:
                        if type(content[key]) is str:
                            file_set.add((key, None))
                        elif type(content[key]) is dict:
                            for inner_key in content[key]:
                                file_set.add((key, inner_key))

                    difference = file_set.difference(self.translations[file.stem])
                    # remove unused translation
                    for key, inner_key in difference:
                        if inner_key is None:
                            print(
                                Fore.RED
                                + f"{lang_dir.name}/{file.name} | remove: {key}"
                            )
                            del content[key]
                        else:
                            print(
                                Fore.RED
                                + f"{lang_dir.name}/{file.name} | remove: {key}.{inner_key}"
                            )
                            del content[key][inner_key]

                    # remove empty key dict
                    remove_key = set()
                    for key in content:
                        if type(content[key]) is dict and len(content[key]) == 0:
                            remove_key.add(key)

                    for key in remove_key:
                        del content[key]

                    with open(file, "w") as f:
                        json.dump(content, f, indent=4, sort_keys=True)


class SourceFileEventHandler(FileSystemEventHandler):
    """Event handler for file system changes"""

    def __init__(self, translation_handler):
        self.translation_handler = translation_handler

    def on_modified(self, event):
        """Called when a file is modified"""
        if not event.is_directory and self._is_source_file(event.src_path):
            self.translation_handler.process_file(event.src_path)

    def on_created(self, event):
        """Called when a file is created"""
        if not event.is_directory and self._is_source_file(event.src_path):
            self.translation_handler.process_file(event.src_path)

    def _is_source_file(self, path):
        """Check if the file is a source file we should process"""
        return any(path.endswith(ext) for ext in SCAN_EXTENSIONS)


def watch_for_changes(translation_handler):
    """Watch for file changes and update translation files"""

    event_handler = SourceFileEventHandler(translation_handler)
    observer = Observer()
    observer.schedule(event_handler, str(SRC_DIR), recursive=True)
    observer.start()

    print(f"Watching for changes in {SRC_DIR}...")
    print("Press Ctrl+C to stop")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()


def scan_existing_files():
    """
    Scans the specified source directory for files matching specified extensions
    and processes each file using the TranslationHandler.

    :return: TranslationHandler object
    """
    handler = TranslationHandler()

    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if any(file.endswith(ex) for ex in SCAN_EXTENSIONS):
                file_path = os.path.join(root, file)
                handler.process_file(file_path)

    return handler


def sort_translation_files():
    """
    This function sorts translation files within a specified directory.

    :return: None
    """
    if not LOCAL_DIR.is_dir():
        print(f"Local Path: {LOCAL_DIR} does not exists, skip sort translation files")
        return

    for lang_dir in LOCAL_DIR.iterdir():
        if lang_dir.is_dir() and lang_dir.name in LANGUAGES:
            for file_path in lang_dir.iterdir():
                with open(file_path, "r") as f:
                    translations = json.load(f)

                with open(file_path, "w") as f:
                    json.dump(translations, f, indent=4, sort_keys=True)


def main():
    help = "--help" or "-h" in sys.argv

    if help:
        print("""
This module provides a basic translation scanner to scan source files
and create translation files based on specified languages.

It supports only two namespaces in one file, e.g:
const [t] = useTranslation("namespace") -> local namespace
const [tg] = useTranslation("namespace") -> global namespace
        """)
        print(Fore.CYAN + "Commands:")
        print(Fore.LIGHTCYAN_EX + f"--watch: watch the {SRC_DIR} for file changes")
        print(Fore.LIGHTCYAN_EX + "--remove-unused: removes all unused translation")
        print()
        return

    print("Starting translation scanner...")
    print(f"Scanning source directory: {SRC_DIR}")
    print(f"Creating translation files in: {LOCAL_DIR}")
    print(f"Languages: {', '.join(LANGUAGES)}")

    # Scan existing files
    handler = scan_existing_files()

    # Sort all translation files
    sort_translation_files()

    # remove unused translation
    remove_unused = "--remove-unused" in sys.argv
    watch_mode = "--watch" in sys.argv

    if remove_unused:
        handler.remove_not_used_translations()

    if watch_mode:
        watch_for_changes(handler)

    print("Translation scanning completed.")


if __name__ == "__main__":
    init(autoreset=True)
    main()
