import csv
import random
import os
import re
from collections import defaultdict

SEED = 42
random.seed(SEED)

def clean(t):
    return re.sub(r'\s+', ' ', t.strip())

SERVICES = {
    'POST_MATRIC_SCHOLARSHIP': {
        'dept': 'DEPT_HIGHER_EDU', 'sub': 'SUB_SCHOLARSHIP_CELL', 'wf': 'WF_SCHOLARSHIP_LIFECYCLE',
        'terms': ['scholarship', 'post matric', 'tuition fee', 'college fees', 'btech', 'degree', 'mba', 'polytechnic', 'engineering', 'bonafide', 'marks memo', 'aishe', 'maintenance allowance', 'reimbursement', 'hostel allowance', 'higher education grant', 'merit means', 'nsp', 'student stipend', 'fee concession', 'btech 2nd year', 'exam fee waiver']
    },
    'INSTANT_E_PAN': {
        'dept': 'DEPT_INCOME_TAX', 'sub': 'SUB_PAN_PROCESSING', 'wf': 'WF_PAN_LIFECYCLE',
        'terms': ['pan card', 'e-pan', 'permanent account number', 'income tax department', 'form 49a', 'tax id', 'pvc pan card', 'aadhaar ekyc pan', 'instant pan', 'nsdl pan', 'utiitsl', 'pan correction', 'reprint pan', 'download epan pdf', '10 digit pan', 'taxpayer identification']
    },
    'INCOME_CERTIFICATE': {
        'dept': 'DEPT_REVENUE', 'sub': 'SUB_TAHSILDAR_OFFICE', 'wf': 'WF_REVENUE_CERT',
        'terms': ['income certificate', 'annual income', 'tahsildar', 'meeseva income', 'family income proof', 'income verification', 'mro office income', 'low income certificate', 'ews income proof', 'salary certificate revenue', 'patwari income report', 'vro enquiry income', 'below 2 lakh income', 'poverty line certificate']
    },
    'LAND_RECORD': {
        'dept': 'DEPT_LAND_ADMIN', 'sub': 'SUB_SURVEY_SETTLEMENT', 'wf': 'WF_LAND_MUTATION',
        'terms': ['land record', 'patta passbook', 'pahani', 'ror 1b', 'land mutation', 'khasra khatauni', 'survey number', 'dharani passbook', 'land ownership copy', 'satbara 7/12', 'fmb sketch', 'adangal copy', 'agriculture land title', 'succession mutation', 'land partition deed']
    },
    'PM_KISAN': {
        'dept': 'DEPT_AGRICULTURE', 'sub': 'SUB_FARMER_WELFARE', 'wf': 'WF_DBT_DIRECT',
        'terms': ['pm kisan', 'kisan samman nidhi', 'farmer installment', 'agriculture subsidy', '2000 rupees kisan', 'dbt farmer scheme', 'farmer financial assistance', 'kisan registration', 'pm kisan ekyc', 'landholding farmer grant', 'kisan 6000 support', 'seeds and fertilizer aid', 'pm kisan pending installment']
    },
    'AYUSHMAN_BHARAT': {
        'dept': 'DEPT_HEALTH', 'sub': 'SUB_HEALTH_AUTHORITY', 'wf': 'WF_HEALTH_CARD',
        'terms': ['ayushman bharat', 'pmjay', 'health card', '5 lakh free treatment', 'ayushman golden card', 'hospital coverage', 'medical insurance scheme', 'national health authority', 'cashless treatment', 'bima card', 'hospital surgery grant', 'ayushman ekyc', 'bpl health insurance', 'inpatient medical cover']
    },
    'PM_AWAS': {
        'dept': 'DEPT_HOUSING', 'sub': 'SUB_URBAN_HOUSING', 'wf': 'WF_HOUSING_SANCTION',
        'terms': ['pm awas yojana', 'pmay', 'housing scheme', 'pucca house subsidy', 'pradhan mantri awas', 'home construction grant', 'housing sanction', 'urban housing assistance', 'interest subsidy clss', 'house allotment', '2.5 lakh housing grant', 'beneficiary led construction', 'pmay geo tagging', 'kutcha house replacement']
    }
}

OOD_DOMAINS = {
    'PASSPORT': ['passport renewal application', 'tatkaal fresh passport slot', 'police verification passport seva', 'passport booklet address change', 'lost duplicate passport fir', 'minor passport application psk', 'ecr suspension passport', 'pcc police clearance certificate'],
    'DRIVING_LICENCE': ['learner driving licence slot', 'permanent 4 wheeler driving test', 'commercial transport driving license renewal', 'add motorcycle vehicle class to dl', 'duplicate smart card driving licence', 'international driving permit idp', 'rto driving track appointment'],
    'ELECTRICITY': ['frequent power cuts low voltage complaint', 'burnt distribution transformer replacement', 'high electricity meter bill complaint', 'new domestic 3 phase electric connection', 'sparking electric pole line repair', 'change electricity meter consumer name'],
    'BIRTH_CERT': ['register newborn baby municipal birth certificate', 'delayed child birth certificate entry', 'correct mother name in birth record', 'download digital birth certificate qr code', 'hospital birth registration slip nagar nigam'],
    'MARRIAGE': ['hindu marriage registration certificate', 'special marriage act 30 days notice', 'marriage certificate for foreign spouse visa', 'sub registrar marriage registration slot', 'inter religion court marriage registration'],
    'CONSUMER_COURT': ['consumer court complaint against defective fridge', 'ecommerce delivered damaged phone refund denied', 'builder delayed flat possession consumer dispute', 'file case in district consumer forum dcdrc', 'warranty claim rejected by service center'],
    'VEHICLE_RC': ['transfer vehicle registration rc to buyer', 'noc for moving car to another state rto', 'remove bank loan hypothecation from rc', 'high security registration plate hsrp booking', 'fitness certificate 15 year old car'],
    'VOTER_ID': ['apply new voter id card form 6', 'shift voter assembly constituency form 8', 'download digital epic voter card', 'correction in electoral roll voter card', 'delete deceased name from voter list form 7']
}

STYLES = [
    'I want to apply for {term} in {district}',
    'Please process my {term} application urgently',
    'Application for {term} under government rules',
    'Respected sir kindly grant {term} for our family',
    'Need financial help and {term} as soon as possible',
    'How to apply online for {term} on official portal',
    'Uploaded documents for {term} verification',
    'My {term} request is pending for approval please check',
    'Kindly sanction {term} for eligible applicant',
    'Submission of required proofs for {term}',
    'Can I get {term} support for this year',
    'Looking for government portal to apply {term}',
    'URGENT: Requesting immediate approval for {term}',
    'We are residing in {district} and applying for {term}',
    'Need official assistance regarding {term} application',
    'Hello officer please guide me for {term}',
    'All my eligibility documents are ready for {term}',
    'Family annual income is low need {term} benefit',
    'Kindly verify my details and approve {term}',
    'Online registration for {term} on state portal'
]

DISTRICTS = ['Hyderabad', 'Warangal', 'Karimnagar', 'Rangareddy', 'Medchal', 'Nizamabad', 'Khammam', 'Nalgonda', 'Mahabubnagar', 'Siddipet']

def generate():
    os.makedirs('data/ai/workflow-router', exist_ok=True)
    
    in_dist = []
    for svc, meta in SERVICES.items():
        samples = set()
        terms = meta['terms']
        for t in terms:
            for s in STYLES:
                for d in DISTRICTS[:5]:
                    phrase = clean(s.format(term=t, district=d))
                    samples.add(phrase)
            # Add permutations
            for t2 in terms:
                samples.add(clean(f'apply for {t} and {t2}'))
                samples.add(clean(f'application form for {t} in {DISTRICTS[0]}'))
                samples.add(clean(f'respected officer please approve {t}'))
                samples.add(clean(f'urgent need of {t} for poor family'))
                samples.add(clean(f'i am eligible for {t} uploaded all proofs'))
                samples.add(clean(f'how to register {t} online without fee'))
                samples.add(clean(f'my {t} was submitted kindly do the needful'))
                samples.add(clean(f'government scheme {t} for welfare'))
        
        # Sample exactly 350 per class
        sample_list = sorted(list(samples))
        random.seed(SEED)
        random.shuffle(sample_list)
        chosen = sample_list[:350]
        for c in chosen:
            in_dist.append({
                'text': c,
                'service_id': svc,
                'department_id': meta['dept'],
                'sub_department_id': meta['sub'],
                'workflow_id': meta['wf']
            })
        print(f'{svc}: {len(chosen)} samples')
        
    print(f'Total In-Distribution Samples: {len(in_dist)}')
    
    # Stratified Split 70/15/15
    by_svc = defaultdict(list)
    for row in in_dist:
        by_svc[row['service_id']].append(row)
        
    train, val, test = [], [], []
    for svc, rows in by_svc.items():
        train.extend(rows[:245]) # 70%
        val.extend(rows[245:245+52]) # 15%
        test.extend(rows[245+52:350]) # 15% (53 samples)
        
    print(f'Train: {len(train)}, Val: {len(val)}, Test: {len(test)}')
    
    # OOD generation
    ood = []
    ood_set = set()
    for dom, phrases in OOD_DOMAINS.items():
        for p in phrases:
            for s in STYLES[:10]:
                for d in DISTRICTS[:4]:
                    txt = clean(s.format(term=p, district=d))
                    ood_set.add(txt)
        for p in phrases:
            ood_set.add(clean(f'how to apply {p} online'))
            ood_set.add(clean(f'urgent complaint regarding {p}'))
            ood_set.add(clean(f'help needed for {p} in my area'))
            ood_set.add(clean(f'application form for {p}'))
            
    ood_list = sorted(list(ood_set))
    random.shuffle(ood_list)
    for item in ood_list[:400]:
        ood.append({
            'text': item,
            'service_id': 'OOD_UNKNOWN',
            'department_id': 'OOD_NONE',
            'sub_department_id': 'OOD_NONE',
            'workflow_id': 'WF_MANUAL_REVIEW'
        })
    print(f'OOD Samples: {len(ood)}')
    
    # Leakage test
    tr_txt = {r['text'].lower() for r in train}
    va_txt = {r['text'].lower() for r in val}
    te_txt = {r['text'].lower() for r in test}
    oo_txt = {r['text'].lower() for r in ood}
    
    assert len(tr_txt & va_txt) == 0, 'Train-Val overlap!'
    assert len(tr_txt & te_txt) == 0, 'Train-Test overlap!'
    assert len(va_txt & te_txt) == 0, 'Val-Test overlap!'
    assert len((tr_txt | va_txt | te_txt) & oo_txt) == 0, 'ID-OOD overlap!'
    print('ZERO DATA LEAKAGE: All splits 100% disjoint!')
    
    # Write CSVs
    fieldnames = ['text', 'service_id', 'department_id', 'sub_department_id', 'workflow_id']
    def save(fp, data):
        with open(fp, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(data)
            
    save('data/ai/workflow-router/routing-training-v2.csv', train)
    save('data/ai/workflow-router/routing-validation-v2.csv', val)
    save('data/ai/workflow-router/routing-test-v2.csv', test)
    save('data/ai/workflow-router/routing-ood-v2.csv', ood)
    print('All CSVs successfully created in data/ai/workflow-router/')

if __name__ == '__main__':
    generate()
