# Reflex GitHub Bot

Automated code quality checks on every PR.

## Quick Start (Personal Token)

For individual use, you can set up the bot with a personal access token:

### 1. Create a Personal Access Token

Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens

Create a token with these permissions:
- **Contents**: Read
- **Pull requests**: Read and Write
- **Metadata**: Read

### 2. Deploy the Webhook

The webhook handler is already deployed at:
```
https://georgeo.zo.space/api/reflex-webhook
```

### 3. Create a Repository Webhook

Go to your repo → Settings → Webhooks → Add webhook

- **Payload URL**: `https://georgeo.zo.space/api/reflex-webhook`
- **Content type**: `application/json`
- **Secret**: Generate a random string, save it
- **Events**: Select "Let me select individual events" → Check "Pull requests"
- **Active**: Yes

### 4. Configure Secrets

In Zo Computer Settings → Advanced, add:

```
REFLEX_GITHUB_WEBHOOK_SECRET=your-webhook-secret
REFLEX_GITHUB_APP_TOKEN=your-personal-access-token
```

### 5. Open a PR

Create a pull request and watch the bot comment with quality analysis!

---

## Full GitHub App Setup (Organizations)

For organization-wide use, register as a GitHub App:

### 1. Register the App

Visit: `https://github.com/settings/apps/new`

Use the manifest from `manifest.yml` or fill in:
- **Name**: Reflex Quality Bot
- **Webhook URL**: `https://georgeo.zo.space/api/reflex-webhook`
- **Webhook secret**: Generate and save
- **Permissions**:
  - Contents: Read
  - Pull requests: Write
  - Checks: Write
- **Events**: Pull requests

### 2. Generate Private Key

After creating the app, generate a private key and save the PEM file.

### 3. Install the App

Install the app on your repositories.

### 4. Configure Secrets

```
REFLEX_GITHUB_WEBHOOK_SECRET=your-webhook-secret
REFLEX_GITHUB_APP_ID=your-app-id
REFLEX_GITHUB_APP_PRIVATE_KEY=your-pem-content
```

---

## Comment Format

```markdown
## ⚡ Reflex Quality Check

**Score: 78/100** (+6)

| Metric | Value | Status |
|--------|-------|--------|
| Type Integrity | 89% | ✓ |
| Test Coverage | 72% | ⚠ |
| Code Complexity | 12 avg | ✓ |
| Security Posture | 0 issues | ✓ |
| Dependency Health | 100% | ✓ |
| Code Consistency | 94% | ✓ |
| Build Performance | 1.2s | ✓ |
| Documentation Health | 67% | ⚠ |
| Error Handling | 85% | ✓ |
| Architectural Health | 78% | ⚠ |

---
_Powered by [Reflex](https://github.com/larsontrey720/reflex)_
```

---

## API Endpoint

### POST /api/reflex-webhook

Handles GitHub webhook events.

**Headers:**
- `X-GitHub-Event`: Event type
- `X-GitHub-Delivery`: Unique delivery ID
- `X-Hub-Signature-256`: HMAC signature

**Events Handled:**
- `pull_request.opened`
- `pull_request.synchronize`
- `pull_request.reopened`

**Response:**
```json
{
  "status": "success",
  "score": 78,
  "pr": 42
}
```