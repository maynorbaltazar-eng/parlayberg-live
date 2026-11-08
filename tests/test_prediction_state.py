import unittest
from app import app, state


class PredictionStateTests(unittest.TestCase):
    def test_structured_selections_and_manual_results_round_trip(self):
        original = dict(state)
        try:
            with app.test_client() as client:
                before = client.get('/api/state').get_json()
                pick = {'market': 'winner', 'outcome': 'home', 'period': 'full',
                        'homeName': 'Arsenal', 'awayName': 'Barcelona'}
                payload = {}
                for i in range(1, 9):
                    payload[f'pred{i}Selection'] = dict(pick)
                    payload[f'pred{i}Result'] = 'PENDING'
                    payload[f'pred{i}Pick'] = 'Arsenal to win'
                saved = client.post('/api/state', json=payload)
                self.assertEqual(saved.status_code, 200)
                reloaded = client.get('/api/state').get_json()
                for key, value in payload.items():
                    self.assertEqual(reloaded[key], value)
                client.post('/api/state', json={'pred8Result': 'VOID'})
                snapshot = client.get('/api/state').get_json()
                self.assertEqual(snapshot['pred8Result'], 'VOID')
                self.assertEqual(snapshot['pred1Result'], 'PENDING')
                self.assertEqual(snapshot['homeScore'], before['homeScore'])
                self.assertEqual(snapshot['pred1Icon'], before['pred1Icon'])
                cleared = client.post('/api/state', json={'pred1Selection': None}).get_json()
                self.assertIsNone(cleared['pred1Selection'])
                self.assertEqual(cleared['pred2Selection'], pick)
        finally:
            state.clear()
            state.update(original)

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
