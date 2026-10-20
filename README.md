# Scarab of RA

A browser reconstruction of **Scarab of RA 1.4**, the Macintosh game by
**Rick Holzgrafe / Semicolon Software** (© 1987–1992).

Explore the pyramid, manage provisions and lamp oil, avoid traps and Guardians,
and recover the Crown, Staff and Scarab of RA.

- Modern interface by default; press **O** to switch to the original view.
- English by default, with German and optional subtle colours in Settings.
- Automatic expedition checkpoints, explicit saves, keyboard controls and a field guide.
- Shared leaderboard through a Node.js backend and your own PostgreSQL database.

## Run locally

Use Node.js 22 or newer:

```sh
cd prototype
npm ci
npm run dev
```

Open **http://127.0.0.1:4173**. No frontend build is needed. The game works without
a configured database in development; the shared leaderboard requires PostgreSQL.
Run `npm test` from `prototype/` to execute the regression suite.

## Deploy

See [deployment instructions](prototype/DEPLOYMENT.md) for the database migration,
environment variables and Docker/Coolify setup. Use `prototype/` as the Docker
build context. Production requires `DATABASE_URL` and `PUBLIC_ORIGIN`.

## Controls

Arrow keys / WASD move and turn; Q/E/R peek; X turns around; Space waits.
G picks up, U uses, I inspects, T throws, M opens the map, O switches the interface.
Enter confirms the focused dialog action; Tab cycles within the dialog.

## Project notes

[Implementation details](prototype/README.md) and
[original-game comparisons](docs/originalvergleich.md) document the reconstruction
and its known differences. It is not an emulator or a claim of perfect fidelity.
Original source archives, extracted binary resources and local visual previews
are not included; research extraction scripts require those local reference files.

Original artwork and texts retain their original copyrights. This project does
not grant a new license to those materials. Font attribution and additional
technical notes are in the prototype README.
