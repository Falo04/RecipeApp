## Who implements what

- **Backend (`webserver/`)**: the user implements it. Read, review, design and plan backend changes, but don't edit files under `webserver/`. When work needs a backend change, describe it (files, types, behaviour) and leave the code to the user.
- **Frontend (`frontend/`)**: the agent implements it.

For work that spans both, the backend part lands first, by the user; then the agent builds the frontend against it. When triaging or writing tickets, backend tickets get `ready-for-human` and frontend tickets get `ready-for-agent`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues on Falo04/RecipeApp, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` live at the repo root. See `docs/agents/domain.md`.
