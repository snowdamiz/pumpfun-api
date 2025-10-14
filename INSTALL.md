# Private Installation via GitHub Packages

This package is published to GitHub Packages and only available to team members with repository access.

## Team Setup

### 1. Authenticate with GitHub Packages
Each team member needs to create a GitHub personal access token with `read:packages` scope:

```bash
# Create a token at: https://github.com/settings/tokens
# Add the token to your environment:
export GITHUB_TOKEN=your_personal_access_token
```

### 2. Configure npm registry
Add this to your project's `.npmrc` file or your global npm config:

```
@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 3. Install the package
```bash
npm install @yourusername/pumpfun-api
```

## Publishing (For Maintainers)

To publish a new version:

```bash
# Make sure you have a token with write:packages scope
npm version patch  # or minor/major
npm publish
```

## Requirements
- GitHub account with repository access
- Personal access token with `read:packages` scope (team members)
- Personal access token with `write:packages` scope (maintainers)

## Notes
- Package name: `@yourusername/pumpfun-api`
- Replace `yourusername` with your actual GitHub username
- Only team members with repository access can install the package