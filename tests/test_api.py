import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend import config, services
from ml.progression_model import ProgressionModel, STAGES
from ml.Forecast_engine import ForecastEngine


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(config, 'DATABASE', tmp_path / 'history.db')
    with TestClient(app) as client:
        yield client


def test_model_and_frontend_contract(client):
    assert client.get('/api/ready').status_code == 200
    result = client.post('/api/predict', json={'rate': 25, 'magnitude': 20}).json()
    assert result['forecast_method'] == 'heuristic_transition_rules'
    assert result['calibrated'] is False
    assert 'magnitue' not in result['missing_features']
    assert sum(result['transition_probabilities'].values()) == pytest.approx(100, abs=.1)
    assert result['next_confidence'] == max(result['transition_probabilities'].values())
    assert result['risk_score'] in {20, 50, 75, 90}
    assert 0 <= result['uncertainty']['entropy'] <= 1
    assert result['data_quality']['supplied_features'] == 2
    assert sum(result['current_stage_probabilities'].values()) == pytest.approx(100, abs=.1)


@pytest.mark.parametrize('payload', [{}, {'rate': -1}, {'rate': 'NaN'}, {'rate': 'Infinity'},
                                    {'rate': 1e16}, {'rate': 1, 'typo': 1}, {'port_scans': 5}])
def test_invalid_telemetry(client, payload):
    assert client.post('/predict', json=payload).status_code == 422


def test_signed_trends_and_alias(client):
    response = client.post('/predict', json={'rate': 1, 'port_scans_trend': -3, 'magnitude': 17})
    assert response.status_code == 200
    assert 'magnitue' not in response.json()['missing_features']


def test_batch_limits_and_validation(client):
    for rows in [[], [{'rate': 1}] * 101, [{'rate': 1}, {'rate': -1}]]:
        assert client.post('/predict/batch', json={'network_data': rows}).status_code == 422
    result = client.post('/predict/batch', json={'network_data': [{'rate': 1}, {'rate': 50}]}).json()
    assert result['summary']['successful_predictions'] == 2


def test_history_persistence_and_provenance(client):
    response = client.post('/api/analyses', json={'network_data': [{'rate': 1}], 'source': 'synthetic_demo'})
    assert response.status_code == 201
    record = response.json()
    saved = client.get('/api/analyses').json()['analyses']
    assert saved == [record]
    assert record['source'] == 'synthetic_demo'
    assert 'network_data' not in record
    assert config.DATABASE.exists()
    exported = client.get(f'/api/analyses/{record["id"]}/export')
    assert exported.status_code == 200
    assert exported.json() == record
    assert 'attachment' in exported.headers['content-disposition']
    assert client.get('/api/analyses/00000000-0000-0000-0000-000000000000/export').status_code == 404
    assert client.get('/api/analyses?limit=101').status_code == 422


def test_unavailable_is_explicit(client, monkeypatch):
    monkeypatch.setattr(services, 'engine', None)
    assert client.get('/api/ready').status_code == 503
    assert client.get('/health').json()['status'] == 'degraded'
    assert client.post('/predict', json={'rate': 1}).status_code == 503
    assert client.post('/predict/batch', json={'network_data': [{'rate': 1}]}).status_code == 503


def test_internal_error_not_exposed(client, monkeypatch):
    def fail(*args):
        raise ValueError('private server detail')
    monkeypatch.setattr(services.engine, 'forecast', fail)
    response = client.post('/predict', json={'rate': 1})
    assert response.status_code == 500
    assert 'private server detail' not in response.text


def test_unknown_routes_and_spa(client):
    assert client.get('/api/unknown').status_code == 404
    assert client.get('/unknown').status_code == 404
    if (config.FRONTEND / 'index.html').exists():
        assert 'text/html' in client.get('/workspace').headers['content-type']


@pytest.mark.parametrize('stage', STAGES)
def test_progression_argmax(stage):
    result = ProgressionModel().forecast(stage, {})
    assert result['confidence'] == max(result['probabilities'].values())
    assert sum(result['probabilities'].values()) == pytest.approx(1)


def test_benign_persistence_and_low_risk():
    result = ProgressionModel().forecast('Benign', {})
    assert result['next_stage'] == 'Benign'
    engine = ForecastEngine.__new__(ForecastEngine)
    assert engine.calculate_risk('Benign', 'Benign', .99, {}) == 'LOW'
    assert engine.calculate_risk('Exfiltration', 'Lateral Movement', .5, {}) == 'CRITICAL'
    assert services.calculate_risk_score('LOW', 99) < services.calculate_risk_score('MEDIUM', 10)


def test_model_path_independent_of_cwd(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert ForecastEngine().stage_model is not None


def test_weighted_forecast_propagates_classifier_uncertainty():
    engine = ForecastEngine.__new__(ForecastEngine)
    engine.progression_model = ProgressionModel()
    stage, score, probabilities = engine.predict_weighted_next_stage({'Benign': .6, 'Execution': .4}, {})
    # Benign contributes .6*.6; Execution contributes .4*.6 to privilege escalation.
    assert probabilities['Benign'] == pytest.approx(.36)
    assert probabilities['Privilege Escalation'] == pytest.approx(.24)
    assert stage == 'Benign'
    assert score == pytest.approx(.36)
    assert sum(probabilities.values()) == pytest.approx(1)


def test_weighted_forecast_matches_rules_for_certain_classifier():
    engine = ForecastEngine.__new__(ForecastEngine)
    engine.progression_model = ProgressionModel()
    behaviour = {'failed_logins': 20, 'port_scans_trend': 10}
    for stage in STAGES:
        _, _, actual = engine.predict_weighted_next_stage({stage: 1}, behaviour)
        assert actual == pytest.approx(ProgressionModel().forecast(stage, behaviour)['probabilities'])
