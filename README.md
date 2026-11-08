# Parlayberg LIVE
Open control.html to manage the match display.
Use overlay.html as the TikTok LIVE Studio Link source.
For browser-source use, set 720 x 1280.

Run the Flask app (`pip install -r requirements.txt`, then `python app.py`). The controller and overlays synchronize through `/api/state`; serve them from the same app. State is held in server memory and resets when the process restarts.

### Soccer team selector

Search either team by name, nickname, or league, then choose a result. Results are alphabetical and identify the league. Try `EPL`, `LaLiga`, `Serie A`, `Ligue1`, `Bundesliga`, `Eredivisie`, `Liga Portugal`, `MLS`, or `Liga MX` to see one league's clubs. Common aliases such as `Chivas`, `Pumas`, `LAFC`, `Sporting Lisbon`, and accent-free names are supported. This fills the team name and logo preview. Click **UPDATE OVERLAY** to publish both through the existing state API. Searching alone does not change the match. Both sides are independent.

The curated catalog includes 180 clubs across nine leagues: Premier League (20), La Liga (20), Serie A (20), Ligue 1 (18), Bundesliga (18), Eredivisie (18), Liga Portugal (18), MLS (30), and Liga MX (18), plus the existing 14 national teams (flags), for **194 choices**. European leagues and Liga MX use the 2026–27 season; MLS uses calendar-year 2026. Liga MX includes Atlante in place of Mazatlán, and MLS includes San Diego FC and the current Red Bull New York name (searching New York Red Bulls also works). For another team, enter its name and a manual logo URL or upload an image. Remove-logo buttons still work. If the list or image cannot load, manual entry remains available and the overlay uses its existing shield fallback. Selection does not require Sportmonks credentials or external search calls.

All existing 110 names and logo paths remain stable. The 84 added logos are bundled locally as PNGs, using pinned source revisions and a maximum dimension of 512 pixels. `catalog.json` records each source for maintenance; [SOURCES.md](assets/teams/SOURCES.md) documents roster references and source revisions, checked November 7, 2026. Club crests belong to their respective owners; this project does not claim ownership. To extend the list, add a local image and a catalog entry with name, aliases, kind, league, season, source, and root-relative logo path. Verify the image corresponds to the intended team. League membership is a curated season snapshot and should be reviewed after promotion/relegation.

Run controller and overlay regression checks with Node.js: `node --test tests/*.test.cjs`. These exercise search, league membership, selection of every club, state payloads, polling, manual URLs/uploads, removal, unavailable assets, and overlay refresh using a simulated browser and API. Overlay HTML and backend API behavior are unchanged by the league expansion.

With Python dependencies installed, run `python -m unittest discover -s tests` for actual Flask state round trips and static asset route checks. Tests run locally; no production state is changed.
