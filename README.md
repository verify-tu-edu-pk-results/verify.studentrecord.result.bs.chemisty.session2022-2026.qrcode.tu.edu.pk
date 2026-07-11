# Thal University — Result Verification System (Firebase Edition)

A real, working version: admin login + dashboard to add student results and
generate QR codes, and a public page that shows the verified result when a
QR is scanned — from **any device, anywhere**, because the data now lives in
a real cloud database (Firebase Firestore) instead of the browser's local
storage. Fully static, so it deploys straight to **GitHub Pages**.

## Files

| File | Purpose |
|---|---|
| `index.html` | Public entry point, redirects to `result.html` |
| `login.html` / `app-login.js` | Admin sign-in (Firebase Authentication) |
| `admin.html` / `app-admin.js` | Dashboard: add / edit / delete records, view & download QR codes |
| `result.html` / `app-result.js` | Public result verification page (QR points here, e.g. `result.html?token=...`) |
| `firebase-config.js` | **Edit this** — your Firebase project's connection keys |
| `firebase-init.js` | Initializes Firebase once, shared by all pages |
| `firestore.rules` | Security rules — paste into the Firebase console |
| `styles.css` | Shared styling |

---

## 1. Create your Firebase project (free)

1. Go to <https://console.firebase.google.com/> and click **Add project**.
   Name it anything (e.g. "thal-university-results"). You can skip Google
   Analytics.
2. Once created, click the **web icon (`</>`)** on the project overview page
   to register a web app. Give it a nickname and click **Register app**.
3. Firebase shows you a `firebaseConfig` object — copy it.

## 2. Add your config to the project

Open **`firebase-config.js`** and paste your values in:

```js
window.firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "thal-university-results.firebaseapp.com",
  projectId: "thal-university-results",
  storageBucket: "thal-university-results.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

## 3. Turn on Firestore (the database)

1. In the Firebase console sidebar: **Build → Firestore Database → Create database**.
2. Choose **Production mode** (we'll set proper rules next) and pick a
   region close to you.
3. Once created, go to the **Rules** tab, delete the default contents, and
   paste in everything from **`firestore.rules`** in this project, then
   click **Publish**.

This makes results publicly *readable* (so the QR page works for anyone)
but only *writable* by someone signed in as an admin.

## 4. Turn on admin login (Firebase Authentication)

1. In the sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password**.
3. Go to the **Users** tab → **Add user**. Enter the admin's email and a
   password — this is the login you'll use on `login.html`. Add one user
   per admin you want to have access.

There's no public sign-up page anywhere in this project — admins can only
be created from the Firebase console, by you.

## 5. Try it locally

Any static file server works, e.g.:

```
python3 -m http.server 8000
```

Then open:
- `http://localhost:8000/login.html` — sign in with the admin user you created
- `http://localhost:8000/admin.html` — add a student result; a QR code pops up
- Scan it, or open the printed link — it'll load `result.html?token=...`
  showing the live record from Firestore, from any device.

> Note: `firebase-init.js` uses ES module imports, and browsers block
> `type="module"` scripts from running when a page is opened directly via
> `file://`. Always use a local server (or GitHub Pages) rather than
> double-clicking the HTML files.

## 6. Deploy to GitHub Pages

1. Create a new GitHub repository and push all these files to it (root of
   the repo, or a `/docs` folder — your choice).
2. In the repo: **Settings → Pages → Source**, choose the branch/folder
   you pushed to, and save.
3. GitHub gives you a URL like `https://yourname.github.io/your-repo/`.
   That's it — no server to manage, no PHP, no MySQL.
4. Back in the Firebase console → **Authentication → Settings →
   Authorized domains**, add your GitHub Pages domain (e.g.
   `yourname.github.io`) so sign-in works there too.

## How the pieces fit together

- **`admin.html`** requires a signed-in Firebase user (checked via
  `onAuthStateChanged`); if nobody's signed in it redirects to `login.html`.
- Adding a record generates a random `token`, saves the record as a
  Firestore document at `results/{token}`, and shows a QR code encoding
  `result.html?token={token}`.
- **`result.html`** is public — no login needed. It reads `?token=` from
  the URL, fetches `results/{token}` directly from Firestore, and renders
  it. If no token is in the URL, it shows a manual lookup box (by token or
  roll number) instead.
- **Print Result** calls the browser's print dialog; choosing "Save as PDF"
  there produces the PDF download, same as before.

## Customizing

- **Colors / branding**: all in `styles.css` (`--gradient`, `--blue`,
  `--teal` variables at the top).
- **Fields on the result**: add/remove `<div class="field-card">` blocks in
  `result.html` and the matching inputs in `admin.html`'s form + the
  read/write code in `app-admin.js` / `app-result.js`.
- **Costs**: Firebase's free "Spark" plan comfortably covers a
  university-scale result system (tens of thousands of reads/writes per
  day at no cost). You'd only need to upgrade under very heavy traffic.
