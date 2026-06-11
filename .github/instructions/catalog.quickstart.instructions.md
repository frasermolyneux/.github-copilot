---
description: Quickstart index for the org catalog — how to choose between instructions, prompts, and agents, with task-routing examples.
---
# Catalog Quickstart

Use this guide when you are new to the org catalog or when you know the task but not the right entrypoint.

## Choose the right kind

- **Instructions**: use when you need rules, standards, patterns, or platform/shared consumption contracts.
- **Prompts**: use when you want a reusable guided flow for authoring or updating repo content.
- **Agents**: use when you want delegated execution or review.
- **Skills**: use when the catalog publishes reusable domain playbooks.

## Recommended discovery flow

1. Call `get_catalog` for the top-level map and freshness.
2. Call `list_instruction_groups` to find the relevant domain.
3. Call `list_instructions({ prefix: ... })` to narrow to a manageable slice.
4. Call `get_instruction`, `get_prompt`, or `get_agent` once you know the exact entry.
5. Call `recommend_entries({ task: ... })` when you want the server to shortlist likely matches for a natural-language task.

## Task routing examples

- **Update a GitHub Actions workflow**
  - Start with `workflows.*` instructions.
  - Then check the matching workflow prompt.
  - Use `align-project-workflows` if you want delegated workflow alignment.

- **Review in-progress changes**
  - Start with relevant `standards.*`, `patterns.*`, `platform.*`, or `shared.*` instructions.
  - Then use the `code-review` agent.

- **Update README / CONTRIBUTING / SECURITY / repo-level instructions**
  - Start with `metadata.*` instructions.
  - Use `update-project-metadata` for delegated metadata updates.

- **Understand a repo's Azure platform/shared contracts**
  - Start with `platform.*` and `shared.*` instructions.
  - Use `get_catalog` to see which instruction families exist.

## Notes

- Prefer the MCP catalog when it is configured in the client.
- If MCP is not configured, fall back to reading the files directly from `./.github-copilot/`.