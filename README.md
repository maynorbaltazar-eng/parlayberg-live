# Parlayberg LIVE
Open control.html to manage the match display.
Use overlay.html as the TikTok LIVE Studio Link source.
For browser-source use, set 720 x 1280.

Run the Flask app (`pip install -r requirements.txt`, then `python app.py`). The controller and overlays synchronize through `/api/state`; serve them from the same app. State is held in server memory and resets when the process restarts.

## Prediction board

### Outcome picks

Each prediction row has a **Prediction type**, matching outcome controls, a period, and a **Result**. Choose Match winner (home/draw/away), Double chance, Draw no bet, Total goals, Both teams to score, Team total goals, Exact score, Team clean sheet, Total corners, Player to score, or Custom outcome. The selected team names come from that row's logo selectors or its match name. Over/under lines accept nonnegative whole and half numbers; exact scores require whole numbers from 0 to 99. Player and custom outcomes require text.

Outcome picks remain **Pending** until you select **Won**, **Lost**, or **Void** and click **UPDATE OVERLAY**. Changing a pick resets its result to Pending. A live lead, goal counter, final-looking score, or status label does not settle an outcome automatically. For Draw no bet, mark Void yourself if the relevant period ends in a draw. Full match means 90 minutes plus stoppage; other period choices are first half, second half, and extra time only.

The existing **Score / statistic tracker** mode retains its automatic Current/Target behavior; manual results also work for trackers. Old saved rows load in tracker mode with their original values. The existing `predNResult` uses `HIT` for the UI's Won label; structured picks are stored as an optional `predNSelection` object. Pick descriptions are also written to the existing Market/Pick fields for compatibility. Both overlays use the shared display/result rules in `prediction-picks.js`. No external market connection is required.

### Team logos

Each of the eight Predictions Board rows has separate home/away logo searches and team dropdowns using the same 194-team catalog. Select both teams to preview the logos without entering image addresses. A blank/default match title is filled from the selected names; custom match titles are retained. Click **UPDATE OVERLAY** to publish through the existing `predNIcon` / `predNIcon2` fields. Searching alone does not change the row, and Clear logo affects only that side. **USE MAIN MATCH** copies both team names and logos into that prediction. Existing emoji and custom image values remain available under **Custom icon (optional)** and survive loading/saving. Local catalog logos render in both TikTok and Twitch prediction panels.

Search either team by name, nickname, or league, then choose a result. Results are alphabetical and identify the league. Try `EPL`, `LaLiga`, `Serie A`, `Ligue1`, `Bundesliga`, `Eredivisie`, `Liga Portugal`, `MLS`, or `Liga MX` to see one league's clubs. Common aliases such as `Chivas`, `Pumas`, `LAFC`, `Sporting Lisbon`, and accent-free names are supported. This fills the team name and logo preview. Click **UPDATE OVERLAY** to publish both through the existing state API. Searching alone does not change the match. Both sides are independent.

The curated catalog includes 180 clubs across nine leagues: Premier League (20), La Liga (20), Serie A (20), Ligue 1 (18), Bundesliga (18), Eredivisie (18), Liga Portugal (18), MLS (30), and Liga MX (18), plus the existing 14 national teams (flags), for **194 choices**. European leagues and Liga MX use the 2026–27 season; MLS uses calendar-year 2026. Liga MX includes Atlante in place of Mazatlán, and MLS includes San Diego FC and the current Red Bull New York name (searching New York Red Bulls also works). For another team, enter its name and a manual logo URL or upload an image. Remove-logo buttons still work. If the list or image cannot load, manual entry remains available and the overlay uses its existing shield fallback. Selection does not require Sportmonks credentials or external search calls.

All existing 110 names and logo paths remain stable. The 84 added logos are bundled locally as PNGs, using pinned source revisions and a maximum dimension of 512 pixels. `catalog.json` records each source for maintenance; [SOURCES.md](assets/teams/SOURCES.md) documents roster references and source revisions, checked November 7, 2026. Club crests belong to their respective owners; this project does not claim ownership. To extend the list, add a local image and a catalog entry with name, aliases, kind, league, season, source, and root-relative logo path. Verify the image corresponds to the intended team. League membership is a curated season snapshot and should be reviewed after promotion/relegation.

Run controller and overlay regression checks with Node.js: `node --test tests/*.test.cjs`. These exercise search, league membership, selection of every club, state payloads, polling, manual URLs/uploads, removal, unavailable assets, and overlay refresh using a simulated browser and API. Overlay HTML and backend API behavior are unchanged by the league expansion.

With Python dependencies installed, run `python -m unittest discover -s tests` for actual Flask state round trips and static asset route checks. Tests run locally; no production state is changed.
