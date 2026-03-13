# Vendor Repository Notes

Chinese version: [README.md](README.md)

This directory is used to manage pinned versions of external third-party repositories.

All locked external repositories are defined in `vendor/manifest.json`.

After running:

```bash
pnpm vendor:sync
```

the script clones each repository into:

```text
vendor/repos/<name>
```

and checks out the exact commit defined in the manifest so development and deployment do not drift across arbitrary revisions.
