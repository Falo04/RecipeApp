#!/usr/bin/env python3
import argparse
import sys
import subprocess
import shlex
import json
import os
import signal

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


def signal_handler(_sig, _frame):
    print("received interrupt signal")
    sys.exit(1)


def check_return_code(code):
    if code != 0:
        print(f"Command failed with code {code}", file=sys.stderr)
        sys.exit(code)


def get_branch() -> str:
    process = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], stdout=subprocess.PIPE)
    check_return_code(process.returncode)
    return process.stdout.decode("utf-8").strip()


def get_webserver_service():
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


def docker_compose_prod(command: str, unknown_args):
    process = subprocess.run(["docker", "compose", command, *unknown_args])
    check_return_code(process.returncode)


def docker_compose_dev(command: str, unknown_args):
    process = subprocess.run(
        [
            "docker",
            "compose",
            "-f",
            "docker-compose-dev.yml",
            command,
            *unknown_args,
        ]
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
    subparser.add_parser("make-migrations")
    subparser.add_parser("create-user")
    subparser.add_parser("gen-api")

    prod = subparser.add_parser("prod")
    prod_subparsers = prod.add_subparsers(dest="prod_command")
    prod_subparsers.required = True

    for c in DOCKER_COMMANDS:
        prod_subparsers.add_parser(c)

    args, unknown_args = parser.parse_known_args()

    signal.signal(signal.SIGINT, signal_handler)

    branch = get_branch()
    os.environ["DEV_TAG"] = branch

    if args.command == "db":
        docker_compose_dev(
            "exec",
            ["-it", "postgres-dev", "su", "-c", "psql -U $POSTGRES_USER $DB_NAME"],
        )
    elif args.command == "make-migrations":
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
    elif args.command == "gen-api":
        docker_compose_dev("exec", ["-it", "frontend-dev", "npm", "run", "gen-api"])
    elif args.command == "prod":
        docker_compose_prod(args.prod_command, unknown_args)
    else:
        docker_compose_dev(args.command, unknown_args)


if __name__ == "__main__":
    main()
