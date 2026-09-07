# Contributing to TRACEVAULT

## Workflow

1. **Feature Branch**: Create a new branch from `develop` for your feature or fix.
   `git checkout -b feature/your-feature-name`
2. **Commit**: Make your changes and commit them using Conventional Commits.
3. **Push**: Push your branch to the remote repository.
   `git push origin feature/your-feature-name`
4. **Pull Request**: Open a Pull Request against the `develop` branch.
5. **Review**: Wait for at least one team member to review and approve your PR.
6. **Tests**: Ensure all automated tests pass.
7. **Merge**: Once approved and tests pass, merge the PR into `develop`.

## Commit Convention

Use the following prefixes for your commit messages:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `test:` Adding missing tests or correcting existing tests
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `chore:` Changes to the build process or auxiliary tools and libraries
- `build:` Changes that affect the build system or external dependencies

**Examples:**
- `feat: add transaction normalization model`
- `fix: resolve issue with graph traversal loop`
- `docs: update API contract for wallet analysis`

## Security Principles

- Never store private cryptocurrency keys.
- Never request seed phrases.
- Never expose API credentials to the frontend.
- Validate wallet addresses according to the blockchain.
- Validate all API inputs.
- Use authentication for protected endpoints.
- Log investigation actions appropriately.
- Keep secrets in environment variables (`.env`). DO NOT commit `.env`.
- Do not represent attribution as absolute certainty. All attribution must be evidence-backed and explainable.
