---
name: "git-commit-convention"
description: "Enforces Conventional Commits standard for git commit messages. Use this skill to generate or validate commit messages."
---

# Git Commit Convention (Conventional Commits)

Standardized commit messages are crucial for automated changelogs and clear project history.

## Format Structure
```text
type(scope): subject
```

## Types
*   **`feat`**: New feature
*   **`fix`**: Bug fix
*   **`docs`**: Documentation only
*   **`style`**: Formatting, missing semi colons, etc; no code change
*   **`refactor`**: Refactoring production code
*   **`test`**: Adding tests, refactoring test; no production code change
*   **`chore`**: Updating build tasks, package manager configs, etc; no production code change

## Examples
```bash
git commit -m "feat(auth): implement jwt token handling"
```
