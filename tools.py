import argparse
import os
import sys
import subprocess
import shlex
import json
# from dotenv import load_dotenv

DOCKER_COMMANDS = [
    "up",
    "down",
    "pull",
    "push",
    "build",
    "logs",
    "run",
    "exec",
    "ls",
]


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

        print(info["Name"])

        if "webserver" in info["Name"]:
            return info["Service"]


def docker_compose_dev(command: str, unknown_args):
    process = subprocess.run(
        ["docker", "compose", "-f", "docker-compose-dev.yml", command, *unknown_args]
    )
    check_return_code(process.returncode)


def main():
    parser = argparse.ArgumentParser()
    subparser = parser.add_subparsers(dest="command")
    subparser.required = True

    for c in DOCKER_COMMANDS:
        subparser.add_parser(c)

    # special subcommands
    subparser.add_parser("db")
    subparser.add_parser("make-migratios")
    subparser.add_parser("create-user")

    args, unknown_args = parser.parse_known_args()

    if args.command == "db":
        docker_compose_dev(
            "exec",
            ["-it", "postgres-dev", "psql", "-U", "$DB_USERNAME", "-d", "$DB_DATABASE"],
        )
    elif args.command == "make-migratios":
        webserver_name = get_webserver_service()
        if webserver_name is None:
            print("No service is running. Please run `up` first")
            exit(1)
        docker_compose_dev(
            "exec", ["-it", webserver_name, "server", "make-migrations", *unknown_args]
        )
    elif args.command == "create-user":
        webserver_name = get_webserver_service()
        if webserver_name is None:
            print("No service is running. Please run `up` first")
            exit(1)
        email = input("Email: ")
        username = input("Username: ")
        docker_compose_dev(
            "exec", ["webserver-dev", "server", "create-user", email, username]
        )
        docker_compose_dev("down", ["webserver-dev"])
        docker_compose_dev("up", ["-d", "webserver-dev"])
    else:
        docker_compose_dev(args.command, unknown_args)


if __name__ == "__main__":
    main()
