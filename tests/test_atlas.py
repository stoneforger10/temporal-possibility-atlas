import ast
import copy
import hashlib
import itertools
import json
from pathlib import Path
import re
from types import SimpleNamespace
import pytest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'contracts/TemporalPossibilityAtlas.py'
HELPERS = [n for n in ast.parse(SOURCE.read_text()).body if isinstance(n, (ast.Assign, ast.FunctionDef))]
COORD = 'stoneforger10/temporal-possibility-atlas/' + 'a' * 40 + '/examples/ordered.txt'
NAMES = ['ALPHA', 'BETA', 'GAMMA']


def namespace(gl=None):
    ns = {'hashlib': hashlib, 'json': json, 're': re, 'gl': gl}
    exec(compile(ast.Module(body=HELPERS, type_ignores=[]), str(SOURCE), 'exec'), ns)
    return ns


NS = namespace()
REL = NS['RELATIONS']


def table(names, sets):
    return {'pairs': [dict(left=a, right=b, relations=[r for r in REL if r in labels])
                     for (a, b), labels in zip(NS['event_pairs'](names), sets)]}


ORDERED = table(NAMES, [['BEFORE'], REL, ['MEETS']])
AMBIGUOUS = table(NAMES[:2], [['BEFORE', 'MEETS', 'OVERLAPS']])
CONTRADICTORY = table(NAMES, [['BEFORE'], ['AFTER'], ['BEFORE']])


def setup(vm, deploy, sender, fixture='ordered', bad=False):
    c = deploy(str(SOURCE))
    vm.sender = sender
    names = NAMES if fixture in ('ordered', 'contradictory') else NAMES[:2]
    t = {'ordered': ORDERED, 'ambiguous': AMBIGUOUS, 'contradictory': CONTRADICTORY,
         'unknown': table(NAMES[:2], [REL])}[fixture]
    data = (ROOT / 'examples' / (fixture + '.txt')).read_bytes()
    vm.mock_web(r'.*raw\.githubusercontent\.com.*', {'response': {'status': 200, 'headers': {}, 'body': data}, 'method': 'GET'})
    vm.mock_llm('.*TEMPORAL_ATLAS_V1.*', json.dumps(t))
    coord = COORD.replace('ordered.txt', fixture + '.txt')
    sha = 'f' * 64 if bad else hashlib.sha256(data).hexdigest()
    key = c.analyze('demo', coord, sha, ','.join(names))
    return c, key, c.get_analysis(key), [coord, sha, ','.join(names)]


def test_direct_transitive_necessity_and_reverse_queries(direct_vm, direct_deploy, direct_alice):
    c, key, r, _ = setup(direct_vm, direct_deploy, direct_alice)
    assert r['status'] == 'DETERMINED' and r['envelope']['world_count'] == 1
    assert r['report']['constraints'] == ORDERED
    assert r['root'] == NS['digest']({k: v for k, v in r.items() if k != 'root'})
    assert c.query(key, r['root'], 'ALPHA', 'GAMMA', 'BEFORE')['answer'] == 'NECESSARY'
    assert c.query(key, r['root'], 'GAMMA', 'ALPHA', 'AFTER')['answer'] == 'NECESSARY'
    assert c.query(key, r['root'], 'BETA', 'GAMMA', 'MEETS')['answer'] == 'NECESSARY'
    assert c.query(key, r['root'], 'ALPHA', 'GAMMA', 'OVERLAPS')['answer'] == 'IMPOSSIBLE'
    assert c.query(key, r['root'], 'ALPHA', 'GAMMA', 'BEFORE')['witness'] == [0, 1, 2, 3, 3, 4]


def test_disjunction_never_becomes_a_single_invented_timeline(direct_vm, direct_deploy, direct_alice):
    c, key, r, _ = setup(direct_vm, direct_deploy, direct_alice, 'ambiguous')
    assert r['status'] == 'AMBIGUOUS' and r['envelope']['world_count'] == 3
    assert r['envelope']['pairs'][0]['possible'] == ['BEFORE', 'MEETS', 'OVERLAPS']
    for relation in REL:
        expected = 'POSSIBLE' if relation in AMBIGUOUS['pairs'][0]['relations'] else 'IMPOSSIBLE'
        assert c.query(key, r['root'], 'ALPHA', 'BETA', relation)['answer'] == expected


@pytest.mark.parametrize('fixture,bad,status', [('ordered', True, 'HELD'), ('contradictory', False, 'INCONSISTENT')])
def test_no_vacuous_truth_or_failed_source_claims(fixture, bad, status, direct_vm, direct_deploy, direct_alice):
    c, key, r, _ = setup(direct_vm, direct_deploy, direct_alice, fixture, bad)
    assert r['status'] == status and r['envelope']['world_count'] == 0
    for relation in REL:
        result = c.query(key, r['root'], 'ALPHA', 'BETA', relation)
        assert result['answer'] == 'NO_CLAIM' and result['witness'] == []


def test_missing_information_permits_all_thirteen_and_no_necessity(direct_vm, direct_deploy, direct_alice):
    c, key, r, _ = setup(direct_vm, direct_deploy, direct_alice, 'unknown')
    assert r['status'] == 'AMBIGUOUS' and r['envelope']['world_count'] == 13
    for relation in REL:
        assert c.query(key, r['root'], 'ALPHA', 'BETA', relation)['answer'] == 'POSSIBLE'


def test_identity_replay_cross_actor_and_exact_root_binding(direct_vm, direct_deploy, direct_alice, direct_bob):
    c, key, r, args = setup(direct_vm, direct_deploy, direct_alice)
    assert c.get_request('0x' + bytes(direct_alice).hex(), 'demo') == key
    with direct_vm.expect_revert('Nonce already used'):
        c.analyze('demo', *args)
    with direct_vm.expect_revert('Analysis root mismatch'):
        c.query(key, 'f' * 64, 'ALPHA', 'BETA', 'BEFORE')
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert('Input already analyzed'):
        c.analyze('other', *args)
    with direct_vm.expect_revert('Unknown request'):
        c.get_request('0x' + bytes(direct_bob).hex(), 'other')
    assert c.get_analysis(key) == r


@pytest.mark.parametrize('left,right,label', [('ALPHA', 'ALPHA', 'BEFORE'), ('X', 'BETA', 'BEFORE'), ('ALPHA', 'BETA', 'yes')])
def test_invalid_queries(left, right, label, direct_vm, direct_deploy, direct_alice):
    c, key, r, _ = setup(direct_vm, direct_deploy, direct_alice)
    with direct_vm.expect_revert('Invalid temporal query'):
        c.query(key, r['root'], left, right, label)


@pytest.mark.parametrize('names', ['ALPHA', 'BETA,ALPHA', 'ALPHA,ALPHA', 'A,B,C,D', 'A, b', 'A,', 'A,' + 'X' * 17])
def test_event_bounds(names):
    with pytest.raises(ValueError):
        NS['event_names'](names)


@pytest.mark.parametrize('coordinate', ['https://evil.com/x', COORD.replace('examples/', '../'), COORD.replace('a' * 40, 'main'), COORD + '?x=1'])
def test_url_allowlist(coordinate):
    with pytest.raises(ValueError):
        NS['source_spec'](coordinate, 'a' * 64)


def oracle_relation(r):
    # Independent definition predicates, no call to contract relation().
    a, b, c, d = r
    predicates = [b < c, b == c, a < c < b < d, a == c and b < d, c < a and b < d,
                  c < a and b == d, a == c and b == d, a < c and b == d, a < c and d < b,
                  a == c and d < b, c < a < d < b, a == d, d < a]
    assert sum(predicates) == 1
    return REL[predicates.index(True)]


@pytest.mark.parametrize('n', [2, 3])
def test_exhaustive_weak_order_generator_against_cartesian_oracle(n):
    expected = [list(r) for r in itertools.product(range(2 * n), repeat=2 * n)
                if set(r) == set(range(max(r) + 1)) and all(r[2*i] < r[2*i+1] for i in range(n))]
    assert NS['endpoint_orders'](n) == expected
    assert len(expected) == (13 if n == 2 else 409)
    for ranks in expected:
        for i in range(n):
            for j in range(i + 1, n):
                r = ranks[2*i:2*i+2] + ranks[2*j:2*j+2]
                assert NS['relation'](*r) == oracle_relation(r)


def test_solver_exhaustive_singleton_networks_and_exact_world_hash():
    worlds = NS['endpoint_orders'](3)
    signatures = [tuple(oracle_relation(w[2*i:2*i+2] + w[2*j:2*j+2]) for i, j in [(0,1), (0,2), (1,2)]) for w in worlds]
    # All 13^3 atomic three-event networks, not merely accepted examples.
    for labels in itertools.product(REL, repeat=3):
        matching = [w for w, signature in zip(worlds, signatures) if signature == labels]
        # Canonical ranks uniquely identify a complete atomic relation network.
        assert len(matching) <= 1
        result = NS['closure'](table(NAMES, [[x] for x in labels]), NAMES)
        assert result['world_count'] == len(matching) and result['worlds_root'] == NS['digest'](matching)
    result = NS['closure'](ORDERED, NAMES)
    assert result['pairs'][1]['possible'] == ['BEFORE']
    contradictory = NS['closure'](CONTRADICTORY, NAMES)
    assert contradictory['world_count'] == 0


@pytest.mark.parametrize('bad', ['duplicate', 'extra', 'wrong-pair', 'boolean', 'bad-label'])
def test_model_output_schema_rejects_substitution(bad):
    value = copy.deepcopy(ORDERED)
    if bad == 'duplicate': value['pairs'][0]['relations'] = ['BEFORE', 'BEFORE']
    if bad == 'extra': value['passed'] = True
    if bad == 'wrong-pair': value['pairs'][0]['right'] = 'GAMMA'
    if bad == 'boolean': value['pairs'][0]['relations'] = [True]
    if bad == 'bad-label': value['pairs'][0]['relations'] = ['PROBABLY']
    with pytest.raises(ValueError): NS['constraints'](value, NAMES)


def test_duplicate_json_keys_and_normalization():
    with pytest.raises(ValueError): NS['constraints']('{"pairs":[],"pairs":[]}', NAMES)
    x = table(NAMES[:2], [['MEETS', 'BEFORE']])
    x['pairs'][0]['relations'].reverse()
    assert NS['constraints'](x, NAMES[:2])['pairs'][0]['relations'] == ['BEFORE', 'MEETS']


def test_real_validator_callback_refetches_and_reinterprets_not_just_shape():
    data = (ROOT / 'examples/ordered.txt').read_bytes()
    spec = dict(contract='0x'+'1'*40, policy=NS['POLICY'], source=NS['source_spec'](COORD, hashlib.sha256(data).hexdigest()), events=NAMES)
    calls = dict(web=0, model=0)
    class Return:
        def __init__(self, value): self.calldata = value
    def web(url):
        calls['web'] += 1
        return SimpleNamespace(status=200, body=data)
    def model(*args, **kwargs):
        calls['model'] += 1
        return json.dumps(ORDERED)
    def run(leader, validator):
        report = leader()
        assert validator(Return(report))
        forged = copy.deepcopy(report)
        forged['constraints']['pairs'][0]['relations'] = ['AFTER']
        assert not validator(Return(forged))  # Valid enum/shape but wrong substance.
        foreign = copy.deepcopy(report)
        foreign['spec']['contract'] = '0x'+'2'*40
        assert not validator(Return(foreign)) and not validator(object())
        return report
    gl = SimpleNamespace(nondet=SimpleNamespace(web=SimpleNamespace(get=web), exec_prompt=model), vm=SimpleNamespace(Return=Return, run_nondet_unsafe=run, UserError=ValueError))
    assert namespace(gl)['consensus_constraints'](spec)['constraints'] == ORDERED
    assert calls == dict(web=3, model=3)


@pytest.mark.parametrize('body,http,expected', [(b'',200,'SIZE_ERROR'), (b'x'*4097,200,'SIZE_ERROR'), (b'\xff',200,'ENCODING_ERROR'), (b'not found',404,'HTTP_ERROR')])
def test_acquisition_fail_closed(body, http, expected):
    gl = SimpleNamespace(nondet=SimpleNamespace(web=SimpleNamespace(get=lambda _: SimpleNamespace(status=http, body=body))))
    ns = namespace(gl)
    spec = ns['source_spec'](COORD, 'a'*64)
    row = ns['fetch_source'](spec)
    assert row['status'] == expected and not ns['source_ok'](spec, row)


def test_global_inconsistency_and_unknown_are_different_semantics():
    assert NS['closure'](CONTRADICTORY, NAMES)['world_count'] == 0
    assert NS['closure'](table(NAMES, [REL, REL, REL]), NAMES)['world_count'] == 409
    # Empty direct relation set is contradictory, not an UNKNOWN escape hatch.
    assert NS['closure'](table(NAMES[:2], [[]]), NAMES[:2])['world_count'] == 0


@pytest.mark.parametrize('change', ['body', 'http', 'hash', 'url'])
def test_acquisition_report_cannot_substitute_any_evidence_field(change):
    body = (ROOT / 'examples/ordered.txt').read_text()
    sha = hashlib.sha256(body.encode()).hexdigest()
    spec = NS['source_spec'](COORD, sha)
    row = dict(url=spec['url'], http=200, status='OK', body=body, hash=sha)
    if change == 'body': row['body'] += 'invented'
    if change == 'http': row['http'] = True
    if change == 'hash': row['hash'] = 'f'*64
    if change == 'url': row['url'] = 'https://evil.test/'
    with pytest.raises(ValueError): NS['source_ok'](spec, row)


def test_actor_cap_and_nonce_bounds(direct_vm, direct_deploy, direct_alice):
    c, key, r, args = setup(direct_vm, direct_deploy, direct_alice)
    for nonce in ['', 'x'*49, 'white space']:
        with direct_vm.expect_revert('Invalid nonce'):
            c.analyze(nonce, *args)
    from genlayer import Address
    c._instance.counts[str(Address(direct_alice))] = 16
    with direct_vm.expect_revert('Actor limit'):
        c.analyze('new', args[0], 'b'*64, args[2])


def test_malformed_model_never_becomes_consensus_valid_unknown():
    data = (ROOT / 'examples/ordered.txt').read_bytes()
    spec = dict(contract='x', policy=NS['POLICY'], source=NS['source_spec'](COORD, hashlib.sha256(data).hexdigest()), events=NAMES)
    gl = SimpleNamespace(nondet=SimpleNamespace(web=SimpleNamespace(get=lambda _: SimpleNamespace(status=200, body=data)),
         exec_prompt=lambda *a, **k: {'pairs': []}), vm=SimpleNamespace(run_nondet_unsafe=lambda leader, validator: leader(), UserError=ValueError))
    with pytest.raises(ValueError, match='LLM_ERROR'):
        namespace(gl)['consensus_constraints'](spec)


def test_post_consensus_foreign_context_guard():
    spec = dict(contract='x', policy=NS['POLICY'], source=NS['source_spec'](COORD, 'a'*64), events=NAMES)
    gl = SimpleNamespace(vm=SimpleNamespace(run_nondet_unsafe=lambda leader, validator: {'spec': {}, 'source': {}, 'constraints': {}}))
    with pytest.raises(ValueError, match='Report context'):
        namespace(gl)['consensus_constraints'](spec)
