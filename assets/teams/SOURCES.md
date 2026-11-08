# Team catalog sources

Roster snapshot: 2026–27 men's first divisions and the 2026 MLS season, checked November 7, 2026. Total: 180 clubs plus 14 national teams = 194 choices.

| League | Clubs | Roster reference |
| --- | ---: | --- |
| Premier League | 20 | https://www.premierleague.com/en/news/4675097/all-380-fixtures-for-202627-premier-league-season |
| La Liga | 20 | https://www.laliga.com/en-GB/laliga-easports/clubs |
| Serie A | 20 | https://en.legaseriea.it/serie-a/news/looking-forward-to-the-2026-27-serie-a-fixture-list and https://programmi.sky.it/sport/calcio/serie-a |
| Ligue 1 | 18 | https://ligue1.com/en |
| Bundesliga | 18 | https://www.bundesliga.com/en/bundesliga/clubs |
| Eredivisie | 18 | https://eredivisie.nl/competitie/clubs/ |
| Liga Portugal | 18 | https://www.ligaportugal.pt/news/28135/sociedades-desportivas-licenciadas-para-2026-27 and https://en.wikipedia.org/wiki/2026%E2%80%9327_Primeira_Liga |
| MLS | 30 | https://www.mlssoccer.com/news/2026-mls-competition-guidelines and https://www.mlssoccer.com/clubs/ |
| Liga MX | 18 | https://d1ezr1jf3kzw59.cloudfront.net/docs/publicaciones/ligamx/2026-2027/1/calendario-liga-mx-torneo-apertura-2026.pdf and https://elpais.com/mexico/2026-07-14/arranca-el-apertura-2026-de-la-liga-mx-partidos-de-la-jornada-1-horarios-y-donde-verlos.html |

The original 14 national flags and 12 club crests retain their original paths (`0.png` through `25.png`) and source URLs. Existing saved overlay state therefore continues to resolve those images.

The 84 additional club PNGs are copied from the 2026/2027 folders of [luukhopman/football-logos](https://github.com/luukhopman/football-logos), revision `2a3978f0b4730645c205d855a4bda54c161183e9`. Each new catalog entry links to its exact source file at that revision. Logos are bundled locally; the running controller does not contact that repository or an external logo service.

The next expansion adds 84 more clubs while preserving all previous 110 name/logo pairs:

- Eredivisie and Liga Portugal: 36 logos from the same pinned `luukhopman/football-logos` revision above.
- MLS and 17 Liga MX clubs: 47 PNGs from [Sachawd/wc26-assets](https://github.com/Sachawd/wc26-assets), revision `678d8838fb1e3e89e830ad02da55cd44d1fa5eb9`.
- Atlante: rendered from `logos/mexico/Atlante_FC.svg` in [JoseArroyave/football-logos](https://github.com/JoseArroyave/football-logos); the exact source commit is recorded in Atlante's catalog entry.

The new assets are rendered as transparent PNGs with a maximum dimension of 512 pixels, without enlargement. Each catalog entry links to its source at an immutable revision. Current Liga MX membership includes Atlante rather than Mazatlán; the MLS entry Red Bull New York accepts New York Red Bulls / NYRB / RBNY as aliases. The extra 84 logos have no runtime dependency on any source service.

Club crests remain the property of their respective owners. This repository does not claim ownership of the marks or grant rights on behalf of their owners.

Review membership after promotion/relegation. Update the season and roster references along with the catalog. Add a local PNG before adding a catalog entry. Do not rename existing image files, because `/api/state`, manual URLs, and saved controller values may reference them.
