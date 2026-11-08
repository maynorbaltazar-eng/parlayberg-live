// Bundled crests/flags keep live selection independent of external services.
let soccerTeams = [];
const normalizeTeam = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const leagueAliases = {
  'Premier League': 'EPL English Premier League',
  'La Liga': 'LaLiga Spanish Primera Division',
  'Serie A': 'SerieA Italian',
  'Ligue 1': 'Ligue1 League1 French',
  'Bundesliga': 'German'
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
  } catch (error) {
    for (const side of ['home', 'away']) document.getElementById(side + 'SearchStatus').textContent = 'Team list unavailable. Enter a team name and logo URL or upload below.';
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
