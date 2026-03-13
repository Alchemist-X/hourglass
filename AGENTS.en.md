# Project Collaboration Rules

Chinese version: [AGENTS.md](AGENTS.md)

Last updated: 2026-03-13

## Purpose

This file defines the repository-level rules for code comments, documentation language, and documentation maintenance.

## Rules

### 1. Code comments must be in English

- All code comments should be written in English.
- This includes:
  - inline comments
  - block comments
  - function or doc comments
  - comments inside configuration files

### 2. Human-facing Markdown should default to Chinese

Any Markdown file primarily written for people to read should use Chinese as the primary version.

This includes:

- `README`
- `progress`
- `todo`
- `explore`
- `vendor` notes
- design notes, research notes, and operational instructions

### 3. Every documentation update must keep both Chinese and English versions

For any human-facing Markdown document, maintain:

- one Chinese version
- one English version

Recommended naming:

- Chinese primary file:
  - `README.md`
  - `progress.md`
  - `todo-loop.md`
- English copy:
  - `README.en.md`
  - `progress.en.md`
  - `todo-loop.en.md`

Directory-level `README` files follow the same rule:

- `vendor/README.md`
- `vendor/README.en.md`

### 4. Chinese is the default entry point

- The Chinese version keeps the primary file name.
- The English version uses the `*.en.md` suffix.
- When someone opens the repository docs directly, Chinese should be the first version they see.

### 5. Update policy

Whenever any of the following happens, both language versions must be updated together:

- adding a new human-facing document
- modifying an existing documentation file
- updating progress notes
- updating TODOs
- adding or revising research notes

If a change updates only Chinese but not English, the documentation update is incomplete.

## Active convention in this repository

From now on, this repository uses:

- English for code comments
- Chinese primary Markdown plus English copies for human-facing docs
- Chinese as the default documentation entry point

## Notes

These rules apply to human-facing content. They do not require translating protocol field names, third-party quoted terms, or machine-oriented outputs.
