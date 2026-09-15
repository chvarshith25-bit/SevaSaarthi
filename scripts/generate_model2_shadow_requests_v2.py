import json
import random

random.seed(1337) # Distinct seed from v1

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
        'requestId': f'M2-V2-REQ-{req_id_counter:04d}',
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

# Shuffled indices for non-overlapping selections
cit_indices = list(range(len(citizens)))
random.shuffle(cit_indices)

# 1. EXACT / STRONG MATCHES (64 requests = 20%)
for i in range(64):
    c = citizens[cit_indices[i % len(citizens)]]
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

# 2. INITIALS & NAME VARIATIONS (48 requests = 15%)
for i in range(48):
    c = citizens[cit_indices[(64 + i) % len(citizens)]]
    parts = c['full_name'].split()
    if len(parts) >= 3:
        init_name = f"{parts[0][0]}. {parts[1][0]}. {' '.join(parts[2:])}"
    elif len(parts) == 2:
        init_name = f"{parts[0][0]}. {parts[1]}"
    else:
        init_name = f"{parts[0][0]}. Kumar"
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
    requests.append(make_req('INITIALS', q, c['citizen_id'], 'POSITIVE', f'Initials: {init_name} for {c["full_name"]}'))

# 3. SPELLING / FUZZY VARIATIONS (48 requests = 15%)
for i in range(48):
    c = citizens[cit_indices[(112 + i) % len(citizens)]]
    orig = c['full_name']
    words = orig.split()
    # Apply phonetic/transliteration variation to first or last token
    if len(words) >= 2:
        w0 = words[0]
        if 'ee' in w0.lower(): w0 = w0.lower().replace('ee', 'i').title()
        elif 'oo' in w0.lower(): w0 = w0.lower().replace('oo', 'u').title()
        elif 'sh' in w0.lower(): w0 = w0.lower().replace('sh', 's').title()
        elif 'v' in w0.lower(): w0 = w0.lower().replace('v', 'w').title()
        elif 'dh' in w0.lower(): w0 = w0.lower().replace('dh', 'd').title()
        elif 'th' in w0.lower(): w0 = w0.lower().replace('th', 't').title()
        else: w0 = w0 + 'a'
        mod = f"{w0} {' '.join(words[1:])}"
    else:
        mod = orig + 'h'
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
    requests.append(make_req('SPELLING_FUZZY', q, c['citizen_id'], 'POSITIVE', f'Fuzzy spelling: {mod} for {orig}'))

# 4. ADDRESS VARIATIONS & CONTRACTIONS (32 requests = 10%)
for i in range(32):
    c = citizens[cit_indices[(160 + i) % len(citizens)]]
    addr = (c.get('address') or 'Main Road')
    addr_mod = addr.replace('Road', 'Rd').replace('Nagar', 'Ngr').replace('Street', 'St').replace('Lane', 'Ln').replace('Cross', 'X')
    q = {
        'name': c['full_name'],
        'dateOfBirth': c.get('date_of_birth'),
        'fatherName': c.get('father_name') or c.get('guardian_name'),
        'address': addr_mod,
        'district': c.get('district'),
        'pincode': c.get('pincode'),
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('ADDRESS_VARIATION', q, c['citizen_id'], 'POSITIVE', 'Contracted address tokens'))

# 5. MISSING BIOGRAPHICAL FIELDS (32 requests = 10%)
for i in range(32):
    c = citizens[cit_indices[(192 + i) % len(citizens)]]
    sub_type = i % 3
    if sub_type == 0: # Missing DOB
        q = {'name': c['full_name'], 'fatherName': c.get('father_name') or c.get('guardian_name'), 'address': c.get('address'), 'district': c.get('district'), 'pincode': c.get('pincode'), 'allowedRegistries': ALL_REGS, 'consentVerified': True}
        notes = 'Missing DOB'
    elif sub_type == 1: # Missing Father
        q = {'name': c['full_name'], 'dateOfBirth': c.get('date_of_birth'), 'address': c.get('address'), 'district': c.get('district'), 'pincode': c.get('pincode'), 'allowedRegistries': ALL_REGS, 'consentVerified': True}
        notes = 'Missing Father'
    else: # Missing Address
        q = {'name': c['full_name'], 'dateOfBirth': c.get('date_of_birth'), 'fatherName': c.get('father_name') or c.get('guardian_name'), 'district': c.get('district'), 'pincode': c.get('pincode'), 'allowedRegistries': ALL_REGS, 'consentVerified': True}
        notes = 'Missing Address'
    requests.append(make_req('MISSING_FIELDS', q, c['citizen_id'], 'POSITIVE', notes))

# 6. HARD HOMONYM COLLISIONS (32 requests = 10%)
for i in range(32):
    c = citizens[cit_indices[(224 + i) % len(citizens)]]
    coll_type = i % 3
    if coll_type == 0: # Conflicting DOB
        q = {'name': c['full_name'], 'dateOfBirth': '1942-11-14', 'fatherName': c.get('father_name') or c.get('guardian_name'), 'address': c.get('address'), 'district': c.get('district'), 'pincode': c.get('pincode'), 'allowedRegistries': ALL_REGS, 'consentVerified': True}
        notes = 'Conflicting DOB with identical full name'
    elif coll_type == 1: # Conflicting Father
        q = {'name': c['full_name'], 'dateOfBirth': c.get('date_of_birth'), 'fatherName': 'Jagannath Prasad Shrestha', 'address': c.get('address'), 'district': c.get('district'), 'pincode': c.get('pincode'), 'allowedRegistries': ALL_REGS, 'consentVerified': True}
        notes = 'Conflicting Father with identical full name'
    else: # Conflicting District & Pincode
        q = {'name': c['full_name'], 'dateOfBirth': c.get('date_of_birth'), 'fatherName': c.get('father_name') or c.get('guardian_name'), 'address': 'Bandra West Hill Road', 'district': 'Mumbai Suburban', 'pincode': '400050', 'allowedRegistries': ALL_REGS, 'consentVerified': True}
        notes = 'Conflicting District with identical full name'
    requests.append(make_req('HARD_COLLISION', q, None, 'COLLISION_NEGATIVE', notes))

# 7. NO-MATCH / DISTINCT FICTITIOUS CITIZENS (32 requests = 10%)
fictitious_names = [
    ('Galahad Du Lac', '1982-03-14', 'Lancelot Du Lac', 'Camelot South Gate', 'Camelot', '999001'),
    ('Elizabeth Bennet', '1992-05-18', 'Thomas Bennet', 'Longbourn Estate', 'Hertfordshire', '999002'),
    ('Fitzwilliam Darcy', '1989-10-21', 'James Darcy', 'Pemberley House', 'Derbyshire', '999003'),
    ('Gregor Samsa', '1984-07-03', 'Herr Samsa', 'Prague Old Street', 'Prague', '999004'),
    ('Ishmael Ahab', '1978-06-12', 'Captain Ahab', 'Nantucket Harbor', 'Nantucket', '999005'),
    ('Hercule Poirot', '1965-09-15', 'Achille Poirot', 'Whitehaven Mansions', 'London', '999006'),
    ('Atticus Finch', '1973-12-04', 'Walter Finch', 'Maycomb Courthouse Road', 'Maycomb', '999007'),
    ('Jay Gatsby', '1986-04-09', 'Henry Gatz', 'West Egg Pier', 'Long Island', '999008'),
    ('Dorian Gray', '1994-08-25', 'Kelso Gray', 'Grosvenor Square', 'London', '999009'),
    ('Victor Frankenstein', '1981-11-20', 'Alphonse Frankenstein', 'Geneva Lake Road', 'Geneva', '999010'),
    ('Edmond Dantes', '1975-01-30', 'Louis Dantes', 'Chateau d If Lane', 'Marseille', '999011'),
    ('Jean Valjean', '1970-08-15', 'Mathieu Valjean', 'Faubourg Saint Denis', 'Paris', '999012'),
    ('Cosette Fauchelevent', '1997-03-29', 'Jean Valjean', 'Rue Plumet', 'Paris', '999013'),
    ('Moriarty James', '1968-11-11', 'Professor Moriarty', 'Reichenbach Falls Way', 'Bern', '999014'),
    ('Aragorn Elessar', '1987-03-01', 'Arathorn Elessar', 'Rivendell Valley', 'Gondor', '999015'),
    ('Legolas Greenleaf', '1985-04-16', 'Thranduil Greenleaf', 'Woodland Realm', 'Mirkwood', '999016'),
    ('Gimli Gloinson', '1983-08-19', 'Gloin Stonefoot', 'Erebor Mountain', 'Lonely Mountain', '999017'),
    ('Boromir Denethor', '1980-02-28', 'Denethor Steward', 'White Tower', 'Minas Tirith', '999018'),
    ('Faramir Denethor', '1984-06-05', 'Denethor Steward', 'Ithilien Outpost', 'Minas Tirith', '999019'),
    ('Samwise Gamgee', '1993-04-06', 'Hamfast Gamgee', 'Number 3 Bagshot Row', 'Hobbiton', '999020'),
    ('Peregrin Took', '1995-10-15', 'Paladin Took', 'Great Smials', 'Tuckborough', '999021'),
    ('Meriadoc Brandybuck', '1994-02-12', 'Saradoc Brandybuck', 'Brandy Hall', 'Buckland', '999022'),
    ('Thorin Oakenshield', '1967-07-22', 'Thrain Second', 'Blue Mountains Hall', 'Erebor', '999023'),
    ('Bard Bowman', '1979-09-08', 'Girion Dale', 'Esgaroth Town', 'Lake Town', '999024'),
    ('Elrond Halfelven', '1960-01-01', 'Earendil Mariner', 'Last Homely House', 'Imladris', '999025'),
    ('Galadriel Finarfin', '1958-05-05', 'Finarfin King', 'Caras Galadhon', 'Lothlorien', '999026'),
    ('Celeborn Teleporno', '1955-08-08', 'Galdor Tree', 'Silverlode Bank', 'Lothlorien', '999027'),
    ('Thranduil Oropher', '1962-09-09', 'Oropher King', 'Elvenking Halls', 'Greenwood', '999028'),
    ('Gwaihir Windlord', '1977-04-04', 'Eagle King', 'Eyrie Cliff', 'Misty Mountains', '999029'),
    ('Beorn Skinchanger', '1971-10-10', 'Ursus Elder', 'Carrock Homestead', 'Anduin Vale', '999030'),
    ('Radagast Brown', '1964-12-12', 'Yavanna Guardian', 'Rhosgobel Cottage', 'Mirkwood Borders', '999031'),
    ('Barliman Butterbur', '1972-02-02', 'Barnabas Butterbur', 'Prancing Pony Inn', 'Bree', '999032')
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
    requests.append(make_req('NO_MATCH_FICTITIOUS', q, None, 'DISTINCT_NEGATIVE', 'Fictitious citizen - zero registry rows'))

# 8. SPARSE SINGLE-TOKEN QUERIES (16 requests = 5%)
sparse_names = ['Suresh', 'Ramesh', 'Priya', 'Lakshmi', 'Anil', 'Sunita', 'Rajesh', 'Kavita', 'Manoj', 'Deepak', 'Gita', 'Vijay', 'Pooja', 'Kiran', 'Santosh', 'Vandana']
for sn in sparse_names:
    q = {
        'name': sn,
        'allowedRegistries': ALL_REGS,
        'consentVerified': True
    }
    requests.append(make_req('SPARSE_QUERY', q, None, 'SPARSE_AMBIGUOUS', f'Single-token query without disambiguating fields: {sn}'))

# 9. CROSS-REGISTRY CORROBORATION (16 requests = 5%)
high_corrob_cits = [cid for cid, rows in reg_by_cit.items() if len(rows) >= 4]
for i in range(16):
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
    requests.append(make_req('MULTI_REGISTRY_CORROBORATION', q, cid, 'POSITIVE', 'Multi-registry corroborated candidate'))

with open('scripts/model2_shadow_test_requests_v2.json', 'w', encoding='utf-8') as f:
    json.dump(requests, f, indent=2)

print(f"Generated fresh {len(requests)} independent shadow requests saved to scripts/model2_shadow_test_requests_v2.json")
