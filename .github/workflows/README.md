# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the PumpFun API client package.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Published releases

**Jobs:**
- **test**: Runs tests on Node.js 18, 20, and 22
- **build**: Builds the package and uploads artifacts
- **security**: Runs security audits and Snyk scans
- **publish**: Publishes to npm on releases
- **size-limit**: Validates bundle size (< 500KB)
- **integration-tests**: Runs integration tests with mock API
- **docs**: Generates TypeDoc documentation
- **performance**: Runs performance benchmarks
- **notification**: Summarizes results

### 2. Pull Request Checks (`pull-request.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches

**Jobs:**
- **quick-checks**: Formatting, linting, type checking, unit tests
- **size-check**: Bundle size validation
- **security-scan**: Dependency audit and sensitive data check
- **commit-message-check**: Validates conventional commit format
- **pr-summary**: Generates PR summary

### 3. Dependency Update (`dependency-update.yml`)

**Triggers:**
- Every Monday at 9:00 AM UTC
- Manual workflow dispatch

**Jobs:**
- **update-dependencies**: Updates dependencies and creates PR

## Required Secrets

Add these secrets to your GitHub repository:

### `NPM_TOKEN`
- **Description**: npm authentication token for publishing
- **Required for**: Publish job
- **How to get**: Create an automation token on npmjs.com

### `SNYK_TOKEN`
- **Description**: Snyk API token for security scanning
- **Required for**: Optional (Snyk scan will be skipped if not provided)
- **How to get**: Create a token on snyk.io

## Environment Variables

The workflows use these environment variables:

- `NODE_AUTH_TOKEN`: npm token (set automatically from `NPM_TOKEN` secret)
- `API_BASE_URL`: Mock API URL for integration tests

## Quality Gates

### Bundle Size
- Main bundle must be < 500KB
- ESM bundle must be < 500KB
- Warnings shown at 400KB

### Test Coverage
- Minimum 80% coverage required
- Coverage uploaded to Codecov

### Security
- No moderate or high vulnerabilities allowed
- Snyk scan fails on high severity issues

### Code Quality
- All ESLint rules must pass
- Prettier formatting must be consistent
- TypeScript compilation must succeed

## Release Process

1. Create a release on GitHub
2. All CI checks must pass
3. Package is automatically published to npm
4. Documentation is generated and uploaded

## Troubleshooting

### Common Issues

1. **Build failures**: Check if all dependencies are installed and Node.js version is correct
2. **Test failures**: Ensure tests are written correctly and mocks are set up
3. **Size limit exceeded**: Optimize bundle by removing unused dependencies
4. **Security vulnerabilities**: Update dependencies or add overrides
5. **Publish failures**: Check `NPM_TOKEN` secret and package version

### Debugging

- Use the Actions tab on GitHub to view detailed logs
- Check individual job outputs for specific error messages
- Use `workflow_dispatch` to manually trigger workflows for testing

## Best Practices

1. **Conventional Commits**: Use conventional commit format for all changes
2. **Semantic Versioning**: Follow semver for version bumps
3. **Testing**: Write comprehensive tests for all new features
4. **Documentation**: Update docs for API changes
5. **Security**: Regularly update dependencies and audit for vulnerabilities

## Local Development

To run the same checks locally:

```bash
# Install dependencies
npm ci

# Run all CI checks
npm run ci

# Individual checks
npm run type-check
npm run lint
npm run test:coverage
npm run build
npm run security:audit
npm run size:check
```