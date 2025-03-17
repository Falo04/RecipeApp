import argparse
import os
import sys
import subprocess
import shlex
import json
from dotenv import load_dotenv

DOCKER_COMMANDS = ["up", "down", "pull", "push", "build", "logs", "run", "exec", "ls"]


def check_return_code(code):
    if code != 0:
        print(f"Command failed with code {code}", file=sys.stderr)
        sys.exit(code)


def get_webserver_service() -> str | None:
    command = shlex.split("docker compose -f docker-compose-dev.yml ps --format json")
    process = subprocess.run(
        command,
        stdout=subprocess.PIPE,
    )
    check_return_code(process.returncode)
    lines = process.stdout.decode("utf-8").strip()

    if len(lines) == 0:
        return None

    for line in lines.split("\n"):
        info = json.loads(line)

        if "webserver" in [x.split("=")[0] for x in info["Labels"].split(",")]:
            return info["Service"]


def docker_compose_dev(command: str, unknown_args):
    process = subprocess.run(
        ["docker", "compose", "-f", "docker-compose-dev.yml", command, *unknown_args]
    )
    check_return_code(process.returncode)


def main():
    load_dotenv()
    parser = argparse.ArgumentParser()
    subparser = parser.add_subparsers(dest="command")
    subparser.required = True

    for c in DOCKER_COMMANDS:
        subparser.add_parser(c)

    # special subcommands
    subparser.add_parser("db")
    subparser.add_parser("make-migratios")

    args, unknown_args = parser.parse_known_args()

    if args.command == "db":
        db_username = os.getenv("DB_USERNAME")
        db_database = os.getenv("DB_DATABASE")
        docker_compose_dev(
            "exec",
            ["-it", "postgres-dev", "psql", "-U", {db_username}, "-d", {db_database}],
        )
    elif args.command == "make-migratios":
        webserver_name = get_webserver_service()
        if webserver_name is None:
            print("No service is running. Please run `up` first")
            exit(1)
        docker_compose_dev(
            "exec", ["-it", webserver_name, "server", "make-migrations", *unknown_args]
        )
    else:
        docker_compose_dev(args.command, unknown_args)


if __name__ == "__main__":
    main()
