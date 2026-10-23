# Deploying to ddaygame.dev

The game runs on Karl's DigitalOcean droplet, which is managed by Laravel Forge and also hosts karloneill.com. Everything is set up through the Forge dashboard so Forge stays the single owner of nginx, certificates and background processes.

| Item         | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| Domain       | `ddaygame.dev` (DNS on Cloudflare)                                 |
| Droplet      | `209.38.83.176`                                                    |
| Repository   | `cathbad1962/dday-1961`, branch `main`                             |
| App port     | `127.0.0.1:3061` (not reachable from outside; nginx proxies to it) |
| Health check | `https://ddaygame.dev/api/health`                                  |

In the steps below, `<site-dir>` is the site's directory as Forge shows it (for example `/home/forge/ddaygame.dev`). Forge's menu names may differ slightly from those given here.

## One-time setup

### 1. Create the site

In Forge, open the server and add a new site:

- **Domain:** `ddaygame.dev`
- **Project type:** a generic or static site (not Laravel or PHP); nginx is reconfigured in step 5
- **Repository:** `cathbad1962/dday-1961`, branch `main` (the repo is public)
- **Zero-downtime deployments:** on (the server's default)
- Turn off any Composer or framework-specific install options

### 2. Certificate

In the site's SSL (or Domains) section, request a **Let's Encrypt** certificate for `ddaygame.dev`.

Cloudflare must be set to **DNS only** (grey cloud) for this, so Let's Encrypt reaches the droplet directly.

### 3. Deploy script

Keep the lines Forge generates for creating and activating the release. Add the build between them and the restart after activation:

```sh
# --- after Forge has created the new release and cd'd into it ---
npm ci
npm run build

# --- after Forge has activated the release ---
# Supervisor restarts the daemon from the new release.
pkill -u forge -f "packages/server/src/main.ts" || true
```

### 4. Deploy once

Run **Deploy now**. The first deploy creates `<site-dir>/current`, which the daemon needs.

### 5. Background process (daemon)

Add a daemon on the server:

- **Command:**
  ```
  /usr/bin/env PORT=3061 HOST=127.0.0.1 NODE_ENV=production node_modules/.bin/tsx packages/server/src/main.ts
  ```
- **Directory:** `<site-dir>/current/`
- **User:** `forge`
- **Processes:** 1

### 6. nginx

Edit the site's nginx configuration in Forge. Leave every `# FORGE ... (DO NOT REMOVE!)` line and the SSL lines alone. Replace the existing `location / { ... }` block (and remove any `location ~ \.php$` block) with:

```nginx
location / {
    proxy_pass http://127.0.0.1:3061;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
}
```

The `Upgrade`/`Connection` headers and the long read timeout are for the WebSocket connections used by online play.

### 7. Check it

- `https://ddaygame.dev/api/health` returns `{"ok":true,"game":"D-Day","edition":1961}`
- `https://ddaygame.dev/` shows the placeholder page

### 8. Afterwards

1. In Cloudflare, switch the `ddaygame.dev` record to **Proxied** (orange cloud) and set SSL/TLS mode to **Full (strict)**.
2. Remove the setup SSH key from root: in the droplet console, delete the line ending `claude-code-dday@karl-pc` from `/root/.ssh/authorized_keys`.

## Routine deploys

Push to `main`, then press **Deploy now** in Forge (or enable Forge's quick deploy so each push deploys automatically).

## Troubleshooting

| Symptom                        | Check                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------- |
| 502 Bad Gateway                | Daemon not running: see its status and log in Forge                             |
| Old version still showing      | The deploy script's `pkill` line ran; the daemon restarted after activation     |
| Certificate request fails      | Cloudflare record is grey (DNS only) and `ddaygame.dev` resolves to the droplet |
| Health check OK but page blank | `npm run build` succeeded in the deploy log                                     |
