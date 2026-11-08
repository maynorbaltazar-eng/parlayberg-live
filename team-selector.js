// Bundled crests/flags keep live selection independent of external services.
let soccerTeams = [];
const normalizeTeam = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const leagueAliases = {
  'Premier League': 'EPL English Premier League',
  'La Liga': 'LaLiga Spanish Primera Division',
  'Serie A': 'SerieA Italian',
  'Ligue 1': 'Ligue1 League1 French',
  'Bundesliga': 'German',
  'Eredivisie': 'Eredivise Dutch Netherlands Holland',
  'Liga Portugal': 'Portugal Liga Primeira Liga Portuguese Betclic',
  'MLS': 'Major League Soccer USA Canada',
  'Liga MX': 'LigaMX Mexico Mexican Apertura Clausura'
};
function filterTeams(query) {
  const words = normalizeTeam(query).split(' ').filter(Boolean);
  return soccerTeams.filter(team => {
    const searchable = [team.name, team.aliases, team.league, leagueAliases[team.league]].filter(Boolean).join(' ');
    return words.every(word => normalizeTeam(searchable).includes(word));
  }).sort((a, b) => a.name.localeCompare(b.name));
}
function renderTeamOptions(side) {
  const select = document.getElementById(side + 'Preset');
  const matches = filterTeams(document.getElementById(side + 'Search').value);
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = matches.length ? 'Choose team…' : 'No matching teams';
  select.appendChild(placeholder);
  matches.forEach(team => {
    const option = document.createElement('option');
    option.value = team.name;
    option.textContent = team.name + ' — ' + (team.league || team.kind);
    select.appendChild(option);
  });
  document.getElementById(side + 'SearchStatus').textContent = matches.length ? matches.length + ' teams. Select one, then UPDATE OVERLAY.' : 'Use a custom team name and logo URL or upload below.';
}
async function initTeamSelectors() {
  try {
    const response = await fetch('/assets/teams/catalog.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Catalog unavailable');
    soccerTeams = await response.json();
    for (const side of ['home', 'away']) {
      document.getElementById(side + 'Search').addEventListener('input', () => renderTeamOptions(side));
      renderTeamOptions(side);
    }
    for (let i = 1; i <= 8; i++) for (const side of ['Home', 'Away']) {
      const prefix = 'pred' + i + side;
      document.getElementById(prefix + 'Search').addEventListener('input', () => {
        renderTeamOptions(prefix);
        refreshPredictionLogo(i, side);
      });
      renderTeamOptions(prefix);
    }
    refreshPredictionLogos();
  } catch (error) {
    for (const side of ['home', 'away']) document.getElementById(side + 'SearchStatus').textContent = 'Team list unavailable. Enter a team name and logo URL or upload below.';
    for (let i = 1; i <= 8; i++) for (const side of ['Home', 'Away']) {
      document.getElementById('pred' + i + side + 'SearchStatus').textContent = 'Team list unavailable. Your saved icons are kept; use Custom icon below.';
    }
    refreshPredictionLogos();
  }
}
function applyPreset(side, name) {
  const team = soccerTeams.find(team => team.name === name);
  if (!team || !['home', 'away'].includes(side)) return;
  document.getElementById(side + 'Team').value = team.name;
  document.getElementById(side + 'Logo').value = team.logo;
  document.getElementById(side + 'LogoFile').value = '';
  previewLogo(side + 'Logo', side + 'LogoPreview');
  document.getElementById('status').textContent = 'Team and logo selected — click UPDATE OVERLAY';
}
function predictionIconId(i, side) {
  return 'pred' + i + (side === 'Home' ? 'Icon' : 'Icon2');
}
function predictionMatchName(i) {
  const home = soccerTeams.find(team => team.logo === document.getElementById('pred' + i + 'Icon').value);
  const away = soccerTeams.find(team => team.logo === document.getElementById('pred' + i + 'Icon2').value);
  return home && away ? home.name + ' vs ' + away.name : '';
}
function applyPredictionPreset(i, side, name) {
  if (!Number.isInteger(i) || i < 1 || i > 8 || !['Home', 'Away'].includes(side)) return;
  const team = soccerTeams.find(team => team.name === name);
  if (!team) return;
  const previousName = predictionMatchName(i);
  const match = document.getElementById('pred' + i + 'Match');
  document.getElementById(predictionIconId(i, side)).value = team.logo;
  const nextName = predictionMatchName(i);
  if (nextName && (!match.value.trim() || /^MATCH\s*\d+$/i.test(match.value.trim()) || match.value === previousName)) match.value = nextName;
  refreshPredictionLogo(i, side);
  document.getElementById('status').textContent = 'Prediction logo selected — click UPDATE OVERLAY';
  if (typeof predictionPickChanged === 'function') predictionPickChanged(i);
}
function refreshPredictionLogo(i, side) {
  const prefix = 'pred' + i + side;
  const value = document.getElementById(predictionIconId(i, side)).value;
  const preview = document.getElementById(prefix + 'LogoPreview');
  const team = soccerTeams.find(team => team.logo === value);
  document.getElementById(prefix + 'Preset').value = team ? team.name : '';
  preview.replaceChildren();
  if (/^(https?:\/\/|\/assets\/teams\/|data:image\/)/i.test(value)) {
    const image = document.createElement('img');
    image.alt = team ? team.name : 'Custom prediction logo';
    image.onerror = () => { preview.replaceChildren(); preview.textContent = '⚽'; };
    image.src = value;
    preview.appendChild(image);
  } else preview.textContent = value || '⚽';
  if (typeof readPredictionPick === 'function') updatePredPreview(i);
}
function clearPredictionLogo(i, side) {
  document.getElementById(predictionIconId(i, side)).value = '';
  refreshPredictionLogo(i, side);
  document.getElementById('status').textContent = 'Prediction logo cleared — click UPDATE OVERLAY';
}
function refreshPredictionLogos() {
  for (let i = 1; i <= 8; i++) for (const side of ['Home', 'Away']) refreshPredictionLogo(i, side);
}
