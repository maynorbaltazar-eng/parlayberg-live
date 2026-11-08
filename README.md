# Parlayberg LIVE
Open control.html to manage the match display.
Use overlay.html as the TikTok LIVE Studio Link source.
For browser-source use, set 720 x 1280.

Run the Flask app (`pip install -r requirements.txt`, then `python app.py`). The controller and overlays synchronize through `/api/state`; serve them from the same app. State is held in server memory and resets when the process restarts.

### Soccer team selector

Search either team by name, nickname, or league, then choose a result. Results are alphabetical and identify the league. Try `EPL`, `LaLiga`, `Serie A`, `Ligue1`, or `Bundesliga` to see one league's clubs. This fills the team name and logo preview. Click **UPDATE OVERLAY** to publish both through the existing state API. Searching alone does not change the match. Both sides are independent.

The curated catalog includes all 96 clubs in the five requested leagues for 2026–27: Premier League (20), La Liga (20), Serie A (20), Ligue 1 (18), and Bundesliga (18), plus the existing 14 national teams (flags), for 110 choices. For another team, enter its name and a manual logo URL or upload an image. Remove-logo buttons still work. If the list or image cannot load, manual entry remains available and the overlay uses its existing shield fallback. Selection does not require Sportmonks credentials or external search calls.

The original 26 PNGs from ESPN's soccer crest CDN and FlagCDN keep their existing filenames. The additional 84 PNGs are bundled from a pinned revision of `luukhopman/football-logos`. `catalog.json` records each source for maintenance; [SOURCES.md](assets/teams/SOURCES.md) documents roster references and the source revision, checked November 7, 2026. Club crests belong to their respective owners; this project does not claim ownership. To extend the list, add a local image and a catalog entry with name, aliases, kind, league, season, source, and root-relative logo path. Verify the image corresponds to the intended team. League membership is a curated season snapshot and should be reviewed after promotion/relegation.

Run controller and overlay regression checks with Node.js: `node --test tests/*.test.cjs`. These exercise search, league membership, selection of every club, state payloads, polling, manual URLs/uploads, removal, unavailable assets, and overlay refresh using a simulated browser and API. Overlay HTML and backend API behavior are unchanged by the league expansion.

With Python dependencies installed, run `python -m unittest discover -s tests` for actual Flask state round trips and static asset route checks. Tests run locally; no production state is changed.
