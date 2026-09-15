import csv
import random
import os
import re
from collections import defaultdict

SEED = 42
random.seed(SEED)

SERVICES = [
    {
        "service_id": "POST_MATRIC_SCHOLARSHIP",
        "department_id": "DEPT_HIGHER_EDU",
        "sub_department_id": "SUB_SCHOLARSHIP_CELL",
        "workflow_id": "WF_SCHOLARSHIP_LIFECYCLE",
        "keywords": ["scholarship", "post matric", "tuition fee", "college fees", "btech", "degree", "mba", "polytechnic", "engineering", "bonafide", "marks memo", "aishe", "maintenance allowance", "reimbursement", "hostel allowance", "higher education grant", "merit means", "nsp", "student stipend"]
    },
    {
        "service_id": "INSTANT_E_PAN",
        "department_id": "DEPT_INCOME_TAX",
        "sub_department_id": "SUB_PAN_PROCESSING",
        "workflow_id": "WF_PAN_LIFECYCLE",
        "keywords": ["pan card", "e-pan", "permanent account number", "income tax department", "form 49a", "tax id", "pvc pan card", "aadhaar ekyc pan", "instant pan", "nsdl pan", "utiitsl", "pan correction", "reprint pan"]
    },
    {
        "service_id": "INCOME_CERTIFICATE",
        "department_id": "DEPT_REVENUE",
        "sub_department_id": "SUB_TAHSILDAR_OFFICE",
        "workflow_id": "WF_REVENUE_CERT",
        "keywords": ["income certificate", "annual income", "tahsildar", "meeseva income", "family income proof", "income verification", "mro office income", "low income certificate", "ews income proof", "salary certificate revenue", "patwari income report"]
    },
    {
        "service_id": "LAND_RECORD",
        "department_id": "DEPT_LAND_ADMIN",
        "sub_department_id": "SUB_SURVEY_SETTLEMENT",
        "workflow_id": "WF_LAND_MUTATION",
        "keywords": ["land record", "patta passbook", "pahani", "ror 1b", "land mutation", "khasra khatauni", "survey number", "dharani passbook", "land ownership copy", "satbara 7/12", "fmb sketch", "adangal copy"]
    },
    {
        "service_id": "PM_KISAN",
        "department_id": "DEPT_AGRICULTURE",
        "sub_department_id": "SUB_FARMER_WELFARE",
        "workflow_id": "WF_DBT_DIRECT",
        "keywords": ["pm kisan", "kisan samman nidhi", "farmer installment", "agriculture subsidy", "2000 rupees kisan", "dbt farmer scheme", "farmer financial assistance", "kisan registration", "pm kisan ekyc", "landholding farmer grant"]
    },
    {
        "service_id": "AYUSHMAN_BHARAT",
        "department_id": "DEPT_HEALTH",
        "sub_department_id": "SUB_HEALTH_AUTHORITY",
        "workflow_id": "WF_HEALTH_CARD",
        "keywords": ["ayushman bharat", "pmjay", "health card", "5 lakh free treatment", "ayushman golden card", "hospital coverage", "medical insurance scheme", "national health authority", "cashless treatment", "bima card"]
    },
    {
        "service_id": "PM_AWAS",
        "department_id": "DEPT_HOUSING",
        "sub_department_id": "SUB_URBAN_HOUSING",
        "workflow_id": "WF_HOUSING_SANCTION",
        "keywords": ["pm awas yojana", "pmay", "housing scheme", "pucca house subsidy", "pradhan mantri awas", "home construction grant", "housing sanction", "urban housing assistance", "interest subsidy clss", "house allotment"]
    }
]

OOD_CATEGORIES = [
    {"topic": "passport", "examples": ["apply for fresh tatkaal passport", "passport renewal after expiry", "police verification for passport office", "change address in passport booklet", "lost passport duplicate copy application"]},
    {"topic": "driving_licence", "examples": ["apply for new learner driving licence", "permanent 4 wheeler driving license slot", "renew expired commercial driving license", "add motorcycle with gear to my driving licence", "duplicate driving license after losing original"]},
    {"topic": "electricity_complaint", "examples": ["frequent power outage and low voltage in colony", "burnt transformer replacement complaint", "electricity meter reading is too high please calibrate", "new 3 phase domestic electricity connection", "sparking in main electrical service line"]},
    {"topic": "birth_certificate", "examples": ["register newborn baby birth certificate in municipality", "delayed birth certificate entry after 5 years", "correct mother name spelling in municipal birth record", "download official digital copy of birth certificate", "hospital birth discharge registration slip"]},
    {"topic": "marriage_registration", "examples": ["apply for government marriage registration certificate", "special marriage act notice submission", "registered marriage certificate for visa purpose", "hindu marriage act certificate copy", "sub registrar office appointment for marriage certificate"]},
    {"topic": "consumer_complaint", "examples": ["consumer court complaint against defective refrigerator", "e-commerce company delivered damaged mobile phone and refused refund", "unfair trade practice petition against private builder", "file case in district consumer disputes redressal commission", "warranty claim denied by authorized service center"]},
    {"topic": "vehicle_rc", "examples": ["transfer vehicle registration certificate ownership to buyer", "noc for car moving to another state RTO", "remove bank hypothecation from vehicle RC", "apply for high security registration plate HSRP", "road tax calculation for imported bike"]},
    {"topic": "voter_id", "examples": ["apply for new voter ID card form 6", "shift voter constituency address form 8", "download digital e-EPIC voter card with photo", "delete deceased family member from electoral voter list", "correction of date of birth in election voter identity card"]}
]

print("Starting generation...")
