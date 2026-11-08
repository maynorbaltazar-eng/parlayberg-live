# Parlayberg LIVE
Open control.html to manage the match display.
Use overlay.html as the TikTok LIVE Studio Link source.
For browser-source use, set 720 x 1280.

Run the Flask app (`pip install -r requirements.txt`, then `python app.py`). The controller and overlays synchronize through `/api/state`; serve them from the same app. State is held in server memory and resets when the process restarts.

### Soccer team selector

Search either team by name or nickname, then choose a result. This fills the team name and logo preview. Click **UPDATE OVERLAY** to publish both through the existing state API. Searching alone does not change the match. Both sides are independent.

The curated catalog includes 12 clubs and 14 national teams (flags). For another team, enter its name and a manual logo URL or upload an image. Remove-logo buttons still work. If the list or image cannot load, manual entry remains available and the overlay uses its existing shield fallback. Selection does not require Sportmonks credentials or external search calls.

Bundled PNGs in `assets/teams/` were retrieved from ESPN's soccer crest CDN and FlagCDN on November 7, 2026. `catalog.json` records each original source for maintenance. Club crests belong to their respective owners; this project does not claim ownership. To extend the list, add a local image and a catalog entry with name, aliases, kind, source, and root-relative logo path. Verify the image corresponds to the intended team.

Run controller regression checks with Node.js: `node --test tests/team-selector.test.cjs`. These exercise search, selection, state payloads, polling, manual URLs/uploads, removal, and unavailable assets using a simulated browser and API. Overlay HTML and backend API behavior are unchanged.

With Python dependencies installed, run `python -m unittest discover -s tests` for actual Flask state round trips and static asset route checks. Tests run locally; no production state is changed.
