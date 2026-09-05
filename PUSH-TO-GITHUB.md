# Pushing this to GitHub

Everything is already committed — this folder is a complete git repository with one commit on `main`. You just need to create the empty repo on GitHub and push.

## 1. Create the empty repo

Go to **[github.com/new](https://github.com/new)** and set:

| Field | Value |
|---|---|
| Repository name | `Class-Map-beta` |
| Description | Class Map beta — a live classroom map for station lessons, with CAT4 and NGRT driving tiering, grouping and per-tier task cards. |
| Visibility | **Private** |
| Initialise with README | **leave unticked** — this folder already has one |

Leave the .gitignore and licence dropdowns on *None* for the same reason.

## 2. Push

Open a terminal in this folder and run:

```bash
git remote add origin https://github.com/asilivirtualschool-max/Class-Map-beta.git
git push -u origin main
```

If your GitHub username isn't `asilivirtualschool-max`, swap it in the first line.

### Using GitHub Desktop instead

File → Add local repository → choose this folder → Publish repository → untick *Keep this code private* only if you want it public.

## About the Firebase config in `index.html`

`index.html` carries the Firebase web config for `classmap-85e44` — API key, database URL, the lot. That is normal and safe for a Firebase web app: the web API key is a project identifier, not a credential, and it ships in the page source of every Firebase site on the internet. What actually protects the data is the database rules, not the secrecy of the key.

Those rules are set to require a signed-in caller:

```json
{ "rules": { "classmap": { ".read": "auth != null", ".write": "auth != null" } } }
```

and the app signs every device in with Firebase anonymous auth, so an unauthenticated request to the database is refused.

If you fork this for your own school, point `FB_CONFIG` at your own project and apply the same two settings — anonymous sign-in **first**, then the rules. Publishing the rules while anonymous sign-in is still off locks your own app out.

## Optional: host it straight from GitHub

Settings → Pages → deploy from `main` / root. `index.html` is the whole app, so the Pages URL is a working classroom link.
