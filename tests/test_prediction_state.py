import unittest
from app import app, state


class PredictionStateTests(unittest.TestCase):
    def test_both_logos_round_trip_in_all_eight_rows(self):
        original = dict(state)
        try:
            with app.test_client() as client:
                before = client.get('/api/state').get_json()
                payload = {}
                for i in range(1, 9):
                    payload[f'pred{i}Icon'] = '/assets/teams/18.png'
                    payload[f'pred{i}Icon2'] = '/assets/teams/15.png'
                    payload[f'pred{i}Match'] = 'Arsenal vs Barcelona'
                response = client.post('/api/state', json=payload)
                self.assertEqual(response.status_code, 200)
                saved = client.get('/api/state').get_json()
                for field, value in payload.items():
                    self.assertEqual(saved[field], value)
                for field in ('homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'pred1Pick'):
                    self.assertEqual(saved[field], before[field])
                cleared = client.post('/api/state', json={'pred1Icon': ''}).get_json()
                self.assertEqual(cleared['pred1Icon'], '')
                self.assertEqual(cleared['pred1Icon2'], '/assets/teams/15.png')
        finally:
            state.clear()
            state.update(original)
