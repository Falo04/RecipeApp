# Recipe App

A recipe management application that allows users to create, search, and organize their favorite
recipes with ease.

## Overview

FoodAppV2 is a full-stack web application that provides a clean, intuitive interface for creating, editing, and
searching recipes, with features like ingredient management, step-by-step instructions, and a flexible tagging system.

This application is built for use on a **homelab server** or similar low-user environment.

Note:

* The frontend does **not** include a user registration interface. Accounts must be created via the command line.
* Authentication can be disabled for convenience (only recommended when running on a local network).
* OAuth2 support is planned for a future release.

## Usage

### Prerequisites

* Docker (v20.10+)
* Docker Compose (v2.0+)
* Python 3 (for the CLI tool)

### Environment Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/RecipeApp.git
   cd FoodAppV2
   ```

2. Copy and configure the environment file:

   ```bash
   cp .env.example .env
   # Edit the .env file using your preferred text editor
   ```

### Starting the Application

FoodAppV2 provides a utility script `tools.py`, which wraps Docker Compose commands and adds three custom commands:

```bash
python3 tools.py [command]
```

Available commands:

* `prod`: Use Docker Compose for the production environment
* `make-migrations`: Run the web server locally and generate migrations if models have changed
* `create-user`: Run the server and create a new user account

#### Examples

Start the development environment:

```bash
python3 tools.py up -d --build
```

Start the production environment:

```bash
python3 tools.py prod up -d --build
```

This will start the following services:

* PostgreSQL database
* Rust backend server
* Frontend development
* Nginx for routing
* Jaeger for distributed tracing

### Accessing the Application

* Frontend: [http://localhost:8443](http://localhost:8443)
* API: [http://localhost:8443/api/v1](http://localhost:8443/api/v1)
* Swagger Documentation (development
  only): [http://localhost:8443/swagger-ui/index.html](http://localhost:8443/swagger-ui/index.html)
* Jaeger UI:
    * development: [http://localhost:8443/jaeger](http://localhost:8443/jaeger)
    * production: [http://localhost:16686/jaeger](http://localhost:8443/jaeger)

## License

This project is licensed under the [MIT License](LICENSE).
