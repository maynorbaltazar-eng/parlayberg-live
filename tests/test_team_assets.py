"""Run with: python -m unittest discover -s tests"""
import unittest
from app import app, state


class TeamAssetTests(unittest.TestCase):
    def test_assets_and_state_round_trip(self):
        original = dict(state)
        try:
            with app.test_client() as client:
                catalog_response = client.get('/assets/teams/catalog.json')
                self.assertEqual(catalog_response.status_code, 200)
                teams = catalog_response.get_json()
                catalog_response.close()
                for team in teams:
                    response = client.get(team['logo'])
                    self.assertEqual(response.status_code, 200, team['name'])
                    self.assertEqual(response.mimetype, 'image/png')
                    response.close()
                client.post('/api/state', json={'homeScore': 3, 'pred1Pick': 'Keep this pick'})
                for logo in (teams[0]['logo'], 'https://example.com/custom.png', 'data:image/png;base64,dGVzdA==', ''):
                    payload = {'homeTeam': teams[0]['name'], 'homeLogo': logo,
                               'awayTeam': teams[-1]['name'], 'awayLogo': teams[-1]['logo']}
                    saved = client.post('/api/state', json=payload)
                    self.assertEqual(saved.status_code, 200)
                    snapshot = client.get('/api/state').get_json()
                    for key, value in payload.items():
                        self.assertEqual(snapshot[key], value)
                    self.assertEqual(snapshot['homeScore'], 3)
                    self.assertEqual(snapshot['pred1Pick'], 'Keep this pick')
                for route in ('/control.html', '/team-selector.js', '/overlay.html', '/twitch.html'):
                    response = client.get(route)
                    self.assertEqual(response.status_code, 200)
                    response.close()
        finally:
            state.clear()
            state.update(original)


if __name__ == '__main__':
    unittest.main()
