import json
import random

random.seed(42)

with open('data/synthetic/master_citizens.json', 'r', encoding='utf-8') as f:
    citizens = json.load(f)

with open('data/synthetic/all_registries.json', 'r', encoding='utf-8') as f:
    regs = json.load(f)

citizen_lookup = {c['citizen_id']: c for c in citizens}

reg_by_cit = {}
for reg_name, rows in regs.items():
    if reg_name in ('citizens', 'ground_truth'):
        continue
    for r in rows:
        cid = r.get('citizen_id')
        if cid:
            reg_by_cit.setdefault(cid, []).append((reg_name, r))

ALL_REGS = ['revenue_registry', 'education_registry', 'agriculture_registry', 'health_registry', 'housing_registry', 'land_registry', 'pan_tax_registry']

requests = []
req_id_counter = 1

def make_req(category, query, ground_truth_citizen_id=None, expected_match_type='POSITIVE', notes=''):
    global req_id_counter
    req = {
        'requestId': f'M2-REQ-{req_id_counter:04d}',
        'category': category,
        'query': query,
        'groundTruth': {
            'citizenId': ground_truth_citizen_id,
            'expectedMatchType': expected_match_type,
            'notes': notes
        }
    }
    req_id_counter += 1
    return req

# 1. EXACT_MATCH (25)
for i in range(25):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('EXACT_MATCH', q, c['citizen_id'], 'POSITIVE', 'Exact biographical match'))

# 2. INITIALS (15)
for i in range(25, 40):
    c = citizens[i % len(citizens)]
    parts = c['full_name'].split()
    rest = ' '.join(parts[1:]) if len(parts) >= 2 else 'Kumar'
    init_name = parts[0][0] + '. ' + rest
    q = {
        'name': init_name,
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('INITIALS', q, c['citizen_id'], 'POSITIVE', 'Initial variation'))

# 3. SPELLING_TYPO (15)
for i in range(40, 55):
    c = citizens[i % len(citizens)]
    orig = c['full_name']
    if 'sh' in orig.lower():
        mod = orig.lower().replace('sh', 's').title()
    elif 'ee' in orig.lower():
        mod = orig.lower().replace('ee', 'i').title()
    elif 'oo' in orig.lower():
        mod = orig.lower().replace('oo', 'u').title()
    elif 'v' in orig.lower():
        mod = orig.lower().replace('v', 'w').title()
    else:
        mod = orig[:-1] if len(orig) > 3 else orig + 'h'
    q = {
        'name': mod,
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('SPELLING_TYPO', q, c['citizen_id'], 'POSITIVE', 'Typo variation'))

# 4. ADDRESS_CONTRACTION (15)
for i in range(55, 70):
    c = citizens[i % len(citizens)]
    addr = (c.get('address') or 'Main Road').replace('Road', 'Rd').replace('Nagar', 'Ngr').replace('Street', 'St').replace('Colony', 'Col')
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': addr,
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('ADDRESS_CONTRACTION', q, c['citizen_id'], 'POSITIVE', 'Contracted address tokens'))

# 5. MISSING_DOB (10)
for i in range(70, 80):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('MISSING_DOB', q, c['citizen_id'], 'POSITIVE', 'Missing DOB field'))

# 6. MISSING_FATHER (10)
for i in range(80, 90):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('MISSING_FATHER', q, c['citizen_id'], 'POSITIVE', 'Missing father name field'))

# 7. MISSING_ADDRESS (10)
for i in range(90, 100):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('MISSING_ADDRESS', q, c['citizen_id'], 'POSITIVE', 'Missing street address'))

# 8. SAME_NAME_COLLISION_DOB (10)
for i in range(100, 110):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'dateOfBirth': '1945-01-01',
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('SAME_NAME_COLLISION_DOB', q, None, 'COLLISION_NEGATIVE', 'Contradictory DOB with identical name'))

# 9. SAME_NAME_COLLISION_FATHER (10)
for i in range(110, 120):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': 'Zulqarnain Qureshi',
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('SAME_NAME_COLLISION_FATHER', q, None, 'COLLISION_NEGATIVE', 'Contradictory father name with identical name'))

# 10. SAME_NAME_COLLISION_DISTRICT (10)
for i in range(120, 130):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': 'Kanyakumari High Road',
        'district': 'Kanyakumari',
        'pincode': '629001',
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('SAME_NAME_COLLISION_DISTRICT', q, None, 'COLLISION_NEGATIVE', 'Contradictory district/address with identical name'))

# 11. CONTRADICTORY_PINCODE (10)
for i in range(130, 140):
    c = citizens[i % len(citizens)]
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': '110001',
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('CONTRADICTORY_PINCODE', q, c['citizen_id'], 'POSITIVE_WITH_NOISE', 'Contradictory pincode with matching biographicals'))

# 12. NO_MATCH_FICTITIOUS (15)
fictitious_names = [
    ('Alexander Hamilton', '1980-01-11', 'James Hamilton', 'George Street', 'New York', '10001'),
    ('Arthur Pendragon', '1975-05-15', 'Uther Pendragon', 'Camelot Keep', 'Avalon', '999999'),
    ('Bruce Wayne', '1985-02-19', 'Thomas Wayne', 'Wayne Manor', 'Gotham', '123456'),
    ('Clark Kent', '1988-06-18', 'Jonathan Kent', 'Kent Farm', 'Smallville', '678901'),
    ('Diana Prince', '1990-03-22', 'Hippolyta Prince', 'Themyscira Court', 'Gateway', '543210'),
    ('Sherlock Holmes', '1970-01-06', 'Siger Holmes', '221B Baker St', 'London', '500001'),
    ('John Watson', '1972-07-07', 'Henry Watson', '221B Baker St', 'London', '500001'),
    ('Ebenezer Scrooge', '1950-12-25', 'Jacob Marley', 'Counting House', 'Old Town', '110001'),
    ('Frodo Baggins', '1995-09-22', 'Drogo Baggins', 'Bag End', 'Shire', '700001'),
    ('Bilbo Baggins', '1960-09-22', 'Bungo Baggins', 'Bag End', 'Shire', '700001'),
    ('Luke Skywalker', '1983-05-25', 'Anakin Skywalker', 'Moisture Farm', 'Tatooine', '800001'),
    ('Leia Organa', '1983-05-25', 'Bail Organa', 'Royal Palace', 'Alderaan', '800002'),
    ('Tony Stark', '1970-05-29', 'Howard Stark', 'Stark Tower', 'Malibu', '902100'),
    ('Peter Parker', '1998-08-10', 'Richard Parker', 'Forest Hills', 'Queens', '113750'),
    ('Steve Rogers', '1940-07-04', 'Joseph Rogers', 'Brooklyn Heights', 'Brooklyn', '112010')
]
for fn, fdob, ffather, faddr, fdist, fpin in fictitious_names:
    q = {
        'name': fn,
        'dateOfBirth': fdob,
        'fatherName': ffather,
        'address': faddr,
        'district': fdist,
        'pincode': fpin,
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('NO_MATCH_FICTITIOUS', q, None, 'DISTINCT_NEGATIVE', 'Fictitious citizen - zero database presence'))

# 13. AMBIGUOUS_MULTI_CANDIDATE (10)
common_names = ['Amit Kumar', 'Rahul Sharma', 'Priya Patel', 'Suresh Reddy', 'Vijay Singh', 'Anil Rao', 'Sunita Devi', 'Ramesh Chandra', 'Geeta Sharma', 'Rajesh Gupta']
for cn in common_names:
    q = {
        'name': cn,
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('AMBIGUOUS_MULTI_CANDIDATE', q, None, 'AMBIGUOUS', f'Common name: {cn}'))

# 14. MULTI_REGISTRY_CORROBORATION (10)
high_corrob_cits = [cid for cid, rows in reg_by_cit.items() if len(rows) >= 4]
for i in range(10):
    cid = high_corrob_cits[i % len(high_corrob_cits)]
    c = citizen_lookup[cid]
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': c.get('address'),
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'enableGraphCorroboration': True,
        'consentVerified': True
    }
    requests.append(make_req('MULTI_REGISTRY_CORROBORATION', q, cid, 'POSITIVE', 'Multi-registry candidate'))

# 15. SPARSE_SINGLE_TOKEN (5)
sparse_names = ['Suresh', 'Ramesh', 'Priya', 'Lakshmi', 'Anil']
for sn in sparse_names:
    q = {
        'name': sn,
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('SPARSE_SINGLE_TOKEN', q, None, 'SPARSE_AMBIGUOUS', f'Sparse single token: {sn}'))

with open('scripts/model2_shadow_test_requests.json', 'w', encoding='utf-8') as f:
    json.dump(requests, f, indent=2)

print(f'Generated {len(requests)} shadow test requests saved to scripts/model2_shadow_test_requests.json')
