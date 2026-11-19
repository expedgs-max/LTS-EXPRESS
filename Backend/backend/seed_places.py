import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ltc.settings')
django.setup()

from vtc.models import VtcPlace

PLACES_DATA = [
    # --- 58 WILAYAS CENTRES ---
    {"name": "Adrar Centre", "city": "Adrar", "state": "Adrar", "lat": 27.8742, "lng": -0.2939},
    {"name": "Chlef Centre", "city": "Chlef", "state": "Chlef", "lat": 36.1654, "lng": 1.3345},
    {"name": "Laghouat Centre", "city": "Laghouat", "state": "Laghouat", "lat": 33.8000, "lng": 2.8651},
    {"name": "Oum El Bouaghi Centre", "city": "Oum El Bouaghi", "state": "Oum El Bouaghi", "lat": 35.8755, "lng": 7.1135},
    {"name": "Batna Centre", "city": "Batna", "state": "Batna", "lat": 35.5559, "lng": 6.1741},
    {"name": "Béjaïa Centre", "city": "Béjaïa", "state": "Béjaïa", "lat": 36.7558, "lng": 5.0843},
    {"name": "Biskra Centre", "city": "Biskra", "state": "Biskra", "lat": 34.8504, "lng": 5.7280},
    {"name": "Béchar Centre", "city": "Béchar", "state": "Béchar", "lat": 31.6167, "lng": -2.2167},
    {"name": "Blida Centre", "city": "Blida", "state": "Blida", "lat": 36.4700, "lng": 2.8300},
    {"name": "Bouira Centre", "city": "Bouira", "state": "Bouira", "lat": 36.3749, "lng": 3.9020},
    {"name": "Tamanrasset Centre", "city": "Tamanrasset", "state": "Tamanrasset", "lat": 22.7850, "lng": 5.5228},
    {"name": "Tébessa Centre", "city": "Tébessa", "state": "Tébessa", "lat": 35.4042, "lng": 8.1242},
    {"name": "Tlemcen Centre", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8783, "lng": -1.3150},
    {"name": "Tiaret Centre", "city": "Tiaret", "state": "Tiaret", "lat": 35.3710, "lng": 1.3170},
    {"name": "Tizi Ouzou Centre", "city": "Tizi Ouzou", "state": "Tizi Ouzou", "lat": 36.7118, "lng": 4.0459},
    {"name": "Alger Centre", "city": "Alger", "state": "Alger", "lat": 36.7538, "lng": 3.0588},
    {"name": "Djelfa Centre", "city": "Djelfa", "state": "Djelfa", "lat": 34.6728, "lng": 3.2630},
    {"name": "Jijel Centre", "city": "Jijel", "state": "Jijel", "lat": 36.8206, "lng": 5.7667},
    {"name": "Sétif Centre", "city": "Sétif", "state": "Sétif", "lat": 36.1905, "lng": 5.4137},
    {"name": "Saïda Centre", "city": "Saïda", "state": "Saïda", "lat": 34.8303, "lng": 0.1517},
    {"name": "Skikda Centre", "city": "Skikda", "state": "Skikda", "lat": 36.8792, "lng": 6.9075},
    {"name": "Sidi Bel Abbès Centre", "city": "Sidi Bel Abbès", "state": "Sidi Bel Abbès", "lat": 35.1899, "lng": -0.6308},
    {"name": "Annaba Centre", "city": "Annaba", "state": "Annaba", "lat": 36.9000, "lng": 7.7667},
    {"name": "Guelma Centre", "city": "Guelma", "state": "Guelma", "lat": 36.4621, "lng": 7.4261},
    {"name": "Constantine Centre", "city": "Constantine", "state": "Constantine", "lat": 36.3650, "lng": 6.6147},
    {"name": "Médéa Centre", "city": "Médéa", "state": "Médéa", "lat": 36.2642, "lng": 2.7539},
    {"name": "Mostaganem Centre", "city": "Mostaganem", "state": "Mostaganem", "lat": 35.9311, "lng": 0.0892},
    {"name": "M'Sila Centre", "city": "M'Sila", "state": "M'Sila", "lat": 35.7058, "lng": 4.5419},
    {"name": "Mascara Centre", "city": "Mascara", "state": "Mascara", "lat": 35.3967, "lng": 0.1403},
    {"name": "Ouargla Centre", "city": "Ouargla", "state": "Ouargla", "lat": 31.9493, "lng": 5.3250},
    {"name": "Oran Centre", "city": "Oran", "state": "Oran", "lat": 35.6976, "lng": -0.6337},
    {"name": "El Bayadh Centre", "city": "El Bayadh", "state": "El Bayadh", "lat": 33.6832, "lng": 1.0193},
    {"name": "Illizi Centre", "city": "Illizi", "state": "Illizi", "lat": 26.4833, "lng": 8.4667},
    {"name": "Bordj Bou Arréridj Centre", "city": "Bordj Bou Arréridj", "state": "Bordj Bou Arréridj", "lat": 36.0732, "lng": 4.7611},
    {"name": "Boumerdès Centre", "city": "Boumerdès", "state": "Boumerdès", "lat": 36.7664, "lng": 3.4772},
    {"name": "El Tarf Centre", "city": "El Tarf", "state": "El Tarf", "lat": 36.7672, "lng": 8.3138},
    {"name": "Tindouf Centre", "city": "Tindouf", "state": "Tindouf", "lat": 27.6711, "lng": -8.1474},
    {"name": "Tissemsilt Centre", "city": "Tissemsilt", "state": "Tissemsilt", "lat": 35.6072, "lng": 1.8108},
    {"name": "El Oued Centre", "city": "El Oued", "state": "El Oued", "lat": 33.3683, "lng": 6.8674},
    {"name": "Khenchela Centre", "city": "Khenchela", "state": "Khenchela", "lat": 35.4358, "lng": 7.1433},
    {"name": "Souk Ahras Centre", "city": "Souk Ahras", "state": "Souk Ahras", "lat": 36.2864, "lng": 7.9511},
    {"name": "Tipaza Centre", "city": "Tipaza", "state": "Tipaza", "lat": 36.5897, "lng": 2.4475},
    {"name": "Mila Centre", "city": "Mila", "state": "Mila", "lat": 36.4503, "lng": 6.2644},
    {"name": "Aïn Defla Centre", "city": "Aïn Defla", "state": "Aïn Defla", "lat": 36.2647, "lng": 1.9678},
    {"name": "Naâma Centre", "city": "Naâma", "state": "Naâma", "lat": 33.2667, "lng": -0.3167},
    {"name": "Aïn Témouchent Centre", "city": "Aïn Témouchent", "state": "Aïn Témouchent", "lat": 35.2975, "lng": -1.1404},
    {"name": "Ghardaïa Centre", "city": "Ghardaïa", "state": "Ghardaïa", "lat": 32.4909, "lng": 3.6735},
    {"name": "Relizane Centre", "city": "Relizane", "state": "Relizane", "lat": 35.7373, "lng": 0.5558},
    {"name": "Timimoun Centre", "city": "Timimoun", "state": "Timimoun", "lat": 29.2639, "lng": 0.2310},
    {"name": "Bordj Badji Mokhtar Centre", "city": "Bordj Badji Mokhtar", "state": "Bordj Badji Mokhtar", "lat": 21.3283, "lng": 0.9547},
    {"name": "Ouled Djellal Centre", "city": "Ouled Djellal", "state": "Ouled Djellal", "lat": 34.4333, "lng": 5.0667},
    {"name": "Béni Abbès Centre", "city": "Béni Abbès", "state": "Béni Abbès", "lat": 30.1333, "lng": -2.1667},
    {"name": "In Salah Centre", "city": "In Salah", "state": "In Salah", "lat": 27.1936, "lng": 2.4608},
    {"name": "In Guezzam Centre", "city": "In Guezzam", "state": "In Guezzam", "lat": 19.5683, "lng": 5.7694},
    {"name": "Touggourt Centre", "city": "Touggourt", "state": "Touggourt", "lat": 33.1053, "lng": 6.0581},
    {"name": "Djanet Centre", "city": "Djanet", "state": "Djanet", "lat": 24.5533, "lng": 9.4842},
    {"name": "El M'Ghair Centre", "city": "El M'Ghair", "state": "El M'Ghair", "lat": 33.9500, "lng": 5.9167},
    {"name": "El Meniaa Centre", "city": "El Meniaa", "state": "El Meniaa", "lat": 30.5833, "lng": 2.8833},

    # --- TLEMCEN & ENVIRONS ---
    {"name": "Mansourah", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8706, "lng": -1.3408},
    {"name": "Chetouane", "city": "Chetouane", "state": "Tlemcen", "lat": 34.9189, "lng": -1.2825},
    {"name": "Remchi", "city": "Remchi", "state": "Tlemcen", "lat": 35.0617, "lng": -1.4350},
    {"name": "Maghnia", "city": "Maghnia", "state": "Tlemcen", "lat": 34.8467, "lng": -1.7303},
    {"name": "Ghazaouet", "city": "Ghazaouet", "state": "Tlemcen", "lat": 35.0978, "lng": -1.8569},
    {"name": "Nedroma", "city": "Nedroma", "state": "Tlemcen", "lat": 35.0125, "lng": -1.7478},
    {"name": "Sebdou", "city": "Sebdou", "state": "Tlemcen", "lat": 34.6394, "lng": -1.3314},
    {"name": "Hennaya", "city": "Hennaya", "state": "Tlemcen", "lat": 34.9542, "lng": -1.3683},
    {"name": "Beni Saf", "city": "Beni Saf", "state": "Aïn Témouchent", "lat": 35.3019, "lng": -1.3828},
    {"name": "Marsa Ben M'Hidi", "city": "Marsa Ben M'Hidi", "state": "Tlemcen", "lat": 35.0833, "lng": -2.2000},
    {"name": "Honaine", "city": "Honaine", "state": "Tlemcen", "lat": 35.1783, "lng": -1.6567},
    {"name": "Bab El Assa", "city": "Bab El Assa", "state": "Tlemcen", "lat": 34.9583, "lng": -2.0667},
    {"name": "Ouled Mimoun", "city": "Ouled Mimoun", "state": "Tlemcen", "lat": 34.9039, "lng": -1.0347},
    {"name": "Bensekrane", "city": "Bensekrane", "state": "Tlemcen", "lat": 35.0747, "lng": -1.2228},
    {"name": "Sabra", "city": "Sabra", "state": "Tlemcen", "lat": 34.8294, "lng": -1.5306},
    {"name": "Sidi Djillali", "city": "Sidi Djillali", "state": "Tlemcen", "lat": 34.4539, "lng": -1.5167},
    {"name": "Zenata", "city": "Zenata", "state": "Tlemcen", "lat": 34.9833, "lng": -1.4167},
    {"name": "Ain Fezza", "city": "Ain Fezza", "state": "Tlemcen", "lat": 34.8731, "lng": -1.2317},
    {"name": "Grottes de Beni Add", "city": "Ain Fezza", "state": "Tlemcen", "lat": 34.8697, "lng": -1.2008},
    {"name": "Plateau Lalla Setti", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8653, "lng": -1.3142},
    {"name": "Palais El Mechouar", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8828, "lng": -1.3117},
    {"name": "Université Abou Bekr Belkaid", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8967, "lng": -1.3250},
    {"name": "Aéroport Messali Hadj Zenata", "city": "Zenata", "state": "Tlemcen", "lat": 35.0167, "lng": -1.4500},
    {"name": "Gare Ferroviaire de Tlemcen", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8864, "lng": -1.3183},
    {"name": "Hôpital Tidjani Damerdji", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8789, "lng": -1.3283},
    {"name": "Imama", "city": "Mansourah", "state": "Tlemcen", "lat": 34.8800, "lng": -1.3375},
    {"name": "Bab El Karmadin", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8833, "lng": -1.3200},
    {"name": "Koudia", "city": "Tlemcen", "state": "Tlemcen", "lat": 34.8900, "lng": -1.3100},
    {"name": "Ain Tellout", "city": "Ain Tellout", "state": "Tlemcen", "lat": 34.9392, "lng": -0.8903},
    {"name": "Sidi Abdelli", "city": "Sidi Abdelli", "state": "Tlemcen", "lat": 35.0569, "lng": -1.1350},

    # --- ORAN & ENVIRONS ---
    {"name": "Es Senia", "city": "Es Senia", "state": "Oran", "lat": 35.6489, "lng": -0.6231},
    {"name": "Bir El Djir", "city": "Bir El Djir", "state": "Oran", "lat": 35.7175, "lng": -0.5606},
    {"name": "Ain El Turk", "city": "Ain El Turk", "state": "Oran", "lat": 35.7444, "lng": -0.7497},
    {"name": "Arzew", "city": "Arzew", "state": "Oran", "lat": 35.8569, "lng": -0.3167},
    {"name": "Bethioua", "city": "Bethioua", "state": "Oran", "lat": 35.8058, "lng": -0.2642},
    {"name": "Boutlelis", "city": "Boutlelis", "state": "Oran", "lat": 35.5722, "lng": -0.9000},
    {"name": "Gdyel", "city": "Gdyel", "state": "Oran", "lat": 35.7792, "lng": -0.4319},
    {"name": "Misserghin", "city": "Misserghin", "state": "Oran", "lat": 35.6186, "lng": -0.7656},
    {"name": "Canastel", "city": "Oran", "state": "Oran", "lat": 35.7481, "lng": -0.5739},
    {"name": "Akid Lotfi", "city": "Oran", "state": "Oran", "lat": 35.7267, "lng": -0.5911},
    {"name": "USTO (Université des Sciences et de la Technologie)", "city": "Oran", "state": "Oran", "lat": 35.7003, "lng": -0.5964},
    {"name": "Maraval", "city": "Oran", "state": "Oran", "lat": 35.6833, "lng": -0.6500},
    {"name": "Front de Mer Oran", "city": "Oran", "state": "Oran", "lat": 35.7086, "lng": -0.6439},
    {"name": "Fort de Santa Cruz", "city": "Oran", "state": "Oran", "lat": 35.7089, "lng": -0.6628},
    {"name": "Aéroport Ahmed Ben Bella", "city": "Es Senia", "state": "Oran", "lat": 35.6239, "lng": -0.6211},
    {"name": "Gare d'Oran", "city": "Oran", "state": "Oran", "lat": 35.6967, "lng": -0.6386},
    {"name": "Port d'Oran", "city": "Oran", "state": "Oran", "lat": 35.7056, "lng": -0.6406},
    {"name": "El Kerma", "city": "El Kerma", "state": "Oran", "lat": 35.6178, "lng": -0.5892},
    {"name": "Hassi Bounif", "city": "Hassi Bounif", "state": "Oran", "lat": 35.7000, "lng": -0.4833},
    {"name": "Hassi Ben Okba", "city": "Hassi Ben Okba", "state": "Oran", "lat": 35.7333, "lng": -0.4667},
    {"name": "Ain El Bia", "city": "Ain El Bia", "state": "Oran", "lat": 35.8000, "lng": -0.3000},
    {"name": "Mers El Kébir", "city": "Mers El Kébir", "state": "Oran", "lat": 35.7328, "lng": -0.7022},
    {"name": "Bousfer", "city": "Bousfer", "state": "Oran", "lat": 35.7033, "lng": -0.8067},
    {"name": "El Ançor", "city": "El Ançor", "state": "Oran", "lat": 35.6708, "lng": -0.8653},
    {"name": "Les Andalouses", "city": "El Ançor", "state": "Oran", "lat": 35.7258, "lng": -0.8719},

    # --- ALGER & ENVIRONS ---
    {"name": "Bab El Oued", "city": "Alger", "state": "Alger", "lat": 36.7900, "lng": 3.0500},
    {"name": "Casbah d'Alger", "city": "Alger", "state": "Alger", "lat": 36.7847, "lng": 3.0600},
    {"name": "Hydra", "city": "Hydra", "state": "Alger", "lat": 36.7442, "lng": 3.0428},
    {"name": "El Biar", "city": "El Biar", "state": "Alger", "lat": 36.7686, "lng": 3.0306},
    {"name": "Ben Aknoun", "city": "Ben Aknoun", "state": "Alger", "lat": 36.7589, "lng": 3.0139},
    {"name": "Kouba", "city": "Kouba", "state": "Alger", "lat": 36.7258, "lng": 3.0850},
    {"name": "Hussein Dey", "city": "Hussein Dey", "state": "Alger", "lat": 36.7436, "lng": 3.0906},
    {"name": "Bir Mourad Raïs", "city": "Bir Mourad Raïs", "state": "Alger", "lat": 36.7350, "lng": 3.0519},
    {"name": "Bab Ezzouar", "city": "Bab Ezzouar", "state": "Alger", "lat": 36.7167, "lng": 3.1833},
    {"name": "Dar El Beïda", "city": "Dar El Beïda", "state": "Alger", "lat": 36.7133, "lng": 3.2125},
    {"name": "Aéroport Houari Boumediene", "city": "Dar El Beïda", "state": "Alger", "lat": 36.6910, "lng": 3.2154},
    {"name": "Bordj El Kiffan", "city": "Bordj El Kiffan", "state": "Alger", "lat": 36.7483, "lng": 3.1917},
    {"name": "Rouiba", "city": "Rouiba", "state": "Alger", "lat": 36.7381, "lng": 3.2828},
    {"name": "Reghaia", "city": "Reghaia", "state": "Alger", "lat": 36.7389, "lng": 3.3406},
    {"name": "Cheraga", "city": "Cheraga", "state": "Alger", "lat": 36.7667, "lng": 2.9500},
    {"name": "Dely Ibrahim", "city": "Dely Ibrahim", "state": "Alger", "lat": 36.7517, "lng": 2.9844},
    {"name": "Staoueli", "city": "Staoueli", "state": "Alger", "lat": 36.7536, "lng": 2.8889},
    {"name": "Zeralda", "city": "Zeralda", "state": "Alger", "lat": 36.7147, "lng": 2.8422},
    {"name": "Sidi Abdellah", "city": "Mahelma", "state": "Alger", "lat": 36.6719, "lng": 2.8594},
    {"name": "Ain Benian", "city": "Ain Benian", "state": "Alger", "lat": 36.8028, "lng": 2.9219},
    {"name": "Bouzareah", "city": "Bouzareah", "state": "Alger", "lat": 36.7906, "lng": 3.0189},
    {"name": "El Harrach", "city": "El Harrach", "state": "Alger", "lat": 36.7214, "lng": 3.1328},
    {"name": "Oued Smar", "city": "Oued Smar", "state": "Alger", "lat": 36.7028, "lng": 3.1678},
    {"name": "Baraki", "city": "Baraki", "state": "Alger", "lat": 36.6644, "lng": 3.0939},
    {"name": "Birtouta", "city": "Birtouta", "state": "Alger", "lat": 36.6433, "lng": 3.0039},
    {"name": "Draria", "city": "Draria", "state": "Alger", "lat": 36.7169, "lng": 3.0033},
    {"name": "Douera", "city": "Douera", "state": "Alger", "lat": 36.6706, "lng": 2.9469},
    {"name": "Sidi M'Hamed", "city": "Alger", "state": "Alger", "lat": 36.7500, "lng": 3.0600},
    {"name": "Bologhine", "city": "Bologhine", "state": "Alger", "lat": 36.8058, "lng": 3.0394},
    {"name": "Notre Dame d'Afrique", "city": "Bologhine", "state": "Alger", "lat": 36.8008, "lng": 3.0425},

    # --- CONSTANTINE & ENVIRONS ---
    {"name": "Ali Mendjeli (Nouvelle Ville)", "city": "El Khroub", "state": "Constantine", "lat": 36.2417, "lng": 6.5714},
    {"name": "El Khroub", "city": "El Khroub", "state": "Constantine", "lat": 36.2628, "lng": 6.6931},
    {"name": "Ain Smara", "city": "Ain Smara", "state": "Constantine", "lat": 36.2667, "lng": 6.5000},
    {"name": "Hamma Bouziane", "city": "Hamma Bouziane", "state": "Constantine", "lat": 36.4167, "lng": 6.6000},
    {"name": "Didouche Mourad", "city": "Didouche Mourad", "state": "Constantine", "lat": 36.4500, "lng": 6.6333},
    {"name": "Zighoud Youcef", "city": "Zighoud Youcef", "state": "Constantine", "lat": 36.5333, "lng": 6.7167},
    {"name": "Université Constantine 1 (Mentouri)", "city": "Constantine", "state": "Constantine", "lat": 36.3408, "lng": 6.6186},
    {"name": "Aéroport Mohamed Boudiaf", "city": "Constantine", "state": "Constantine", "lat": 36.2764, "lng": 6.6206},
    {"name": "Pont Sidi M'Cid", "city": "Constantine", "state": "Constantine", "lat": 36.3725, "lng": 6.6150},
    {"name": "CHU Ben Badis", "city": "Constantine", "state": "Constantine", "lat": 36.3683, "lng": 6.6192},

    # --- ANNABA & ENVIRONS ---
    {"name": "El Bouni", "city": "El Bouni", "state": "Annaba", "lat": 36.8500, "lng": 7.7333},
    {"name": "Sidi Amar", "city": "Sidi Amar", "state": "Annaba", "lat": 36.8167, "lng": 7.7000},
    {"name": "El Hadjar", "city": "El Hadjar", "state": "Annaba", "lat": 36.8014, "lng": 7.7408},
    {"name": "Berrahal", "city": "Berrahal", "state": "Annaba", "lat": 36.8333, "lng": 7.4500},
    {"name": "Seraïdi", "city": "Seraïdi", "state": "Annaba", "lat": 36.9167, "lng": 7.6667},
    {"name": "Aéroport Rabah Bitat", "city": "El Mellaha", "state": "Annaba", "lat": 36.8222, "lng": 7.8094},
    {"name": "Université Badji Mokhtar", "city": "Sidi Amar", "state": "Annaba", "lat": 36.8208, "lng": 7.7125},
    {"name": "Basilique Saint Augustin", "city": "Annaba", "state": "Annaba", "lat": 36.8814, "lng": 7.7553},

    # --- SÉTIF & ENVIRONS ---
    {"name": "El Eulma", "city": "El Eulma", "state": "Sétif", "lat": 36.1528, "lng": 5.6908},
    {"name": "Ain Oulmene", "city": "Ain Oulmene", "state": "Sétif", "lat": 35.9189, "lng": 5.2958},
    {"name": "Ain Arnat", "city": "Ain Arnat", "state": "Sétif", "lat": 36.1833, "lng": 5.3167},
    {"name": "Ain Azel", "city": "Ain Azel", "state": "Sétif", "lat": 35.8197, "lng": 5.5186},
    {"name": "Bougaa", "city": "Bougaa", "state": "Sétif", "lat": 36.3333, "lng": 5.0833},
    {"name": "Park Mall Sétif", "city": "Sétif", "state": "Sétif", "lat": 36.1917, "lng": 5.4125},
    {"name": "Aéroport 8 Mai 1945", "city": "Ain Arnat", "state": "Sétif", "lat": 36.1781, "lng": 5.3247},

    # --- BLIDA & ENVIRONS ---
    {"name": "Boufarik", "city": "Boufarik", "state": "Blida", "lat": 36.5750, "lng": 2.9125},
    {"name": "Ouled Yaich", "city": "Ouled Yaich", "state": "Blida", "lat": 36.5000, "lng": 2.8667},
    {"name": "Beni Mered", "city": "Beni Mered", "state": "Blida", "lat": 36.5200, "lng": 2.8600},
    {"name": "Chiffa", "city": "Chiffa", "state": "Blida", "lat": 36.4625, "lng": 2.7667},
    {"name": "Mouzaia", "city": "Mouzaia", "state": "Blida", "lat": 36.4667, "lng": 2.6833},
    {"name": "El Affroun", "city": "El Affroun", "state": "Blida", "lat": 36.4683, "lng": 2.6264},
    {"name": "Chréa", "city": "Chréa", "state": "Blida", "lat": 36.4258, "lng": 2.8778},

    # --- BATNA & ENVIRONS ---
    {"name": "Barika", "city": "Barika", "state": "Batna", "lat": 35.3894, "lng": 5.3658},
    {"name": "Ain Touta", "city": "Ain Touta", "state": "Batna", "lat": 35.3789, "lng": 5.9003},
    {"name": "Merouana", "city": "Merouana", "state": "Batna", "lat": 35.6311, "lng": 5.9119},
    {"name": "Tazoult", "city": "Tazoult", "state": "Batna", "lat": 35.4808, "lng": 6.2592},
    {"name": "Arris", "city": "Arris", "state": "Batna", "lat": 35.1972, "lng": 6.1772},
    {"name": "N'Gaous", "city": "N'Gaous", "state": "Batna", "lat": 35.5614, "lng": 5.6108},
    {"name": "Timgad (Ruines Romaines)", "city": "Timgad", "state": "Batna", "lat": 35.4842, "lng": 6.4675},

    # --- BÉJAÏA & ENVIRONS ---
    {"name": "Akbou", "city": "Akbou", "state": "Béjaïa", "lat": 36.4575, "lng": 4.5350},
    {"name": "Amizour", "city": "Amizour", "state": "Béjaïa", "lat": 36.6433, "lng": 4.9039},
    {"name": "Kherrata", "city": "Kherrata", "state": "Béjaïa", "lat": 36.4939, "lng": 5.2778},
    {"name": "Sidi Aïch", "city": "Sidi Aïch", "state": "Béjaïa", "lat": 36.6119, "lng": 4.6933},
    {"name": "El Kseur", "city": "El Kseur", "state": "Béjaïa", "lat": 36.6853, "lng": 4.8569},
    {"name": "Souk El Ténine", "city": "Souk El Ténine", "state": "Béjaïa", "lat": 36.6264, "lng": 5.3406},
    {"name": "Aéroport Abane Ramdane", "city": "Béjaïa", "state": "Béjaïa", "lat": 36.7119, "lng": 5.0700},

    # --- TIZI OUZOU & ENVIRONS ---
    {"name": "Azazga", "city": "Azazga", "state": "Tizi Ouzou", "lat": 36.7444, "lng": 4.3722},
    {"name": "Draa Ben Khedda", "city": "Draa Ben Khedda", "state": "Tizi Ouzou", "lat": 36.7333, "lng": 3.9667},
    {"name": "Tigzirt", "city": "Tigzirt", "state": "Tizi Ouzou", "lat": 36.8889, "lng": 4.1206},
    {"name": "Boghni", "city": "Boghni", "state": "Tizi Ouzou", "lat": 36.5422, "lng": 3.9531},
    {"name": "Larbaa Nath Irathen", "city": "Larbaa Nath Irathen", "state": "Tizi Ouzou", "lat": 36.6367, "lng": 4.2047},
    {"name": "Ain El Hammam", "city": "Ain El Hammam", "state": "Tizi Ouzou", "lat": 36.5647, "lng": 4.3056},
    {"name": "Azeffoun", "city": "Azeffoun", "state": "Tizi Ouzou", "lat": 36.8967, "lng": 4.4217},

    # --- SIDI BEL ABBÈS & ENVIRONS ---
    {"name": "Telagh", "city": "Telagh", "state": "Sidi Bel Abbès", "lat": 34.7842, "lng": -0.5739},
    {"name": "Ben Badis", "city": "Ben Badis", "state": "Sidi Bel Abbès", "lat": 35.1833, "lng": -0.9167},
    {"name": "Sfisef", "city": "Sfisef", "state": "Sidi Bel Abbès", "lat": 35.2344, "lng": -0.2447},
    {"name": "Tessala", "city": "Tessala", "state": "Sidi Bel Abbès", "lat": 35.2639, "lng": -0.7725},
    {"name": "Ras El Ma", "city": "Ras El Ma", "state": "Sidi Bel Abbès", "lat": 34.4833, "lng": -0.8167},

    # --- MOSTAGANEM & ENVIRONS ---
    {"name": "Ain Tedeles", "city": "Ain Tedeles", "state": "Mostaganem", "lat": 35.9833, "lng": 0.3000},
    {"name": "Mazagran", "city": "Mazagran", "state": "Mostaganem", "lat": 35.8958, "lng": 0.0717},
    {"name": "Sidi Lakhdar", "city": "Sidi Lakhdar", "state": "Mostaganem", "lat": 36.1167, "lng": 0.4500},
    {"name": "Hassi Mameche", "city": "Hassi Mameche", "state": "Mostaganem", "lat": 35.8667, "lng": 0.0667},
    {"name": "Salamandre", "city": "Mostaganem", "state": "Mostaganem", "lat": 35.9189, "lng": 0.0653},
    {"name": "Kharrouba", "city": "Mostaganem", "state": "Mostaganem", "lat": 35.9614, "lng": 0.1258},

    # --- AÏN TÉMOUCHENT & ENVIRONS ---
    {"name": "Hammam Bouhadjar", "city": "Hammam Bouhadjar", "state": "Aïn Témouchent", "lat": 35.3789, "lng": -0.9678},
    {"name": "El Malah", "city": "El Malah", "state": "Aïn Témouchent", "lat": 35.3917, "lng": -1.0917},
    {"name": "Ain El Arbaa", "city": "Ain El Arbaa", "state": "Aïn Témouchent", "lat": 35.4092, "lng": -0.8847},
    {"name": "Oulhaca El Gheraba", "city": "Oulhaca", "state": "Aïn Témouchent", "lat": 35.2333, "lng": -1.5167},
    {"name": "Plage Rechgoun", "city": "Beni Saf", "state": "Aïn Témouchent", "lat": 35.2981, "lng": -1.4789},

    # --- MASCARA & ENVIRONS ---
    {"name": "Sig", "city": "Sig", "state": "Mascara", "lat": 35.5292, "lng": -0.1936},
    {"name": "Mohammadia", "city": "Mohammadia", "state": "Mascara", "lat": 35.5886, "lng": 0.0683},
    {"name": "Tighennif", "city": "Tighennif", "state": "Mascara", "lat": 35.4183, "lng": 0.3292},
    {"name": "Ghriss", "city": "Ghriss", "state": "Mascara", "lat": 35.2492, "lng": 0.1589},
    {"name": "Zahana", "city": "Zahana", "state": "Mascara", "lat": 35.5458, "lng": -0.3708},

    # --- SAÏDA & ENVIRONS ---
    {"name": "Ain El Hadjar", "city": "Ain El Hadjar", "state": "Saïda", "lat": 34.7578, "lng": 0.1539},
    {"name": "Youb", "city": "Youb", "state": "Saïda", "lat": 34.9458, "lng": -0.0708},
    {"name": "Ouled Khaled", "city": "Ouled Khaled", "state": "Saïda", "lat": 34.8667, "lng": 0.1333},

    # --- TIARET & ENVIRONS ---
    {"name": "Frenda", "city": "Frenda", "state": "Tiaret", "lat": 35.0644, "lng": 1.0506},
    {"name": "Sougueur", "city": "Sougueur", "state": "Tiaret", "lat": 35.1856, "lng": 1.4967},
    {"name": "Ksar Chellala", "city": "Ksar Chellala", "state": "Tiaret", "lat": 35.2158, "lng": 2.3197},
    {"name": "Rahouia", "city": "Rahouia", "state": "Tiaret", "lat": 35.5244, "lng": 1.0411},
    {"name": "Mahdia", "city": "Mahdia", "state": "Tiaret", "lat": 35.4383, "lng": 1.7614},

    # --- CHLEF & ENVIRONS ---
    {"name": "Tenes", "city": "Tenes", "state": "Chlef", "lat": 36.5111, "lng": 1.3069},
    {"name": "Oued Fodda", "city": "Oued Fodda", "state": "Chlef", "lat": 36.1833, "lng": 1.5333},
    {"name": "Boukadir", "city": "Boukadir", "state": "Chlef", "lat": 36.0667, "lng": 1.1333},
    {"name": "Ain Merane", "city": "Ain Merane", "state": "Chlef", "lat": 36.1667, "lng": 0.9667},
    {"name": "El Karimia", "city": "El Karimia", "state": "Chlef", "lat": 36.1167, "lng": 1.5500},

    # --- MÉDÉA & ENVIRONS ---
    {"name": "Berrouaghia", "city": "Berrouaghia", "state": "Médéa", "lat": 36.1367, "lng": 2.9103},
    {"name": "Ksar El Boukhari", "city": "Ksar El Boukhari", "state": "Médéa", "lat": 35.8889, "lng": 2.7489},
    {"name": "Tablat", "city": "Tablat", "state": "Médéa", "lat": 36.4167, "lng": 3.3167},
    {"name": "Beni Slimane", "city": "Beni Slimane", "state": "Médéa", "lat": 36.2167, "lng": 3.3000},
    {"name": "Ouzera", "city": "Ouzera", "state": "Médéa", "lat": 36.2500, "lng": 2.8500},

    # --- TIPAZA & ENVIRONS ---
    {"name": "Cherchell", "city": "Cherchell", "state": "Tipaza", "lat": 36.6083, "lng": 2.1931},
    {"name": "Kolea", "city": "Kolea", "state": "Tipaza", "lat": 36.6389, "lng": 2.7686},
    {"name": "Bou Ismail", "city": "Bou Ismail", "state": "Tipaza", "lat": 36.6431, "lng": 2.6917},
    {"name": "Hadjout", "city": "Hadjout", "state": "Tipaza", "lat": 36.5133, "lng": 2.4139},
    {"name": "Gouraya", "city": "Gouraya", "state": "Tipaza", "lat": 36.5667, "lng": 1.9000},
    {"name": "Damous", "city": "Damous", "state": "Tipaza", "lat": 36.5500, "lng": 1.7000},
    {"name": "Tombeau de la Chrétienne", "city": "Sidi Rached", "state": "Tipaza", "lat": 36.5744, "lng": 2.5542},

    # --- BOUMERDÈS & ENVIRONS ---
    {"name": "Zemmouri", "city": "Zemmouri", "state": "Boumerdès", "lat": 36.7833, "lng": 3.6000},
    {"name": "Dellys", "city": "Dellys", "state": "Boumerdès", "lat": 36.9172, "lng": 3.9131},
    {"name": "Khemis El Khechna", "city": "Khemis El Khechna", "state": "Boumerdès", "lat": 36.6500, "lng": 3.3333},
    {"name": "Bordj Menaiel", "city": "Bordj Menaiel", "state": "Boumerdès", "lat": 36.7428, "lng": 3.7194},
    {"name": "Thénia", "city": "Thénia", "state": "Boumerdès", "lat": 36.7258, "lng": 3.5564},
    {"name": "Isser", "city": "Isser", "state": "Boumerdès", "lat": 36.7167, "lng": 3.6667},

    # --- BOUIRA & ENVIRONS ---
    {"name": "Lakhdaria", "city": "Lakhdaria", "state": "Bouira", "lat": 36.5644, "lng": 3.5936},
    {"name": "Sour El Ghozlane", "city": "Sour El Ghozlane", "state": "Bouira", "lat": 36.1478, "lng": 3.6897},
    {"name": "Ain Bessam", "city": "Ain Bessam", "state": "Bouira", "lat": 36.2947, "lng": 3.6739},
    {"name": "M'Chedallah", "city": "M'Chedallah", "state": "Bouira", "lat": 36.3667, "lng": 4.2833},
    {"name": "Station Tikjda", "city": "Bouira", "state": "Bouira", "lat": 36.4533, "lng": 4.1333},

    # --- JIJEL & ENVIRONS ---
    {"name": "Taher", "city": "Taher", "state": "Jijel", "lat": 36.7725, "lng": 5.8978},
    {"name": "El Milia", "city": "El Milia", "state": "Jijel", "lat": 36.7506, "lng": 6.2644},
    {"name": "Ziama Mansouriah", "city": "Ziama Mansouriah", "state": "Jijel", "lat": 36.6744, "lng": 5.4789},
    {"name": "Chekfa", "city": "Chekfa", "state": "Jijel", "lat": 36.7667, "lng": 5.9667},
    {"name": "Aéroport Ferhat Abbas", "city": "Taher", "state": "Jijel", "lat": 36.7950, "lng": 5.8736},

    # --- SKIKDA & ENVIRONS ---
    {"name": "El Harrouch", "city": "El Harrouch", "state": "Skikda", "lat": 36.7328, "lng": 6.8553},
    {"name": "Collo", "city": "Collo", "state": "Skikda", "lat": 37.0069, "lng": 6.5606},
    {"name": "Azzaba", "city": "Azzaba", "state": "Skikda", "lat": 36.7419, "lng": 7.1067},
    {"name": "Tamalous", "city": "Tamalous", "state": "Skikda", "lat": 36.8333, "lng": 6.6333},
    {"name": "Filfila", "city": "Filfila", "state": "Skikda", "lat": 36.9000, "lng": 7.0333},

    # --- GUELMA & SOUK AHRAS ---
    {"name": "Oued Zenati", "city": "Oued Zenati", "state": "Guelma", "lat": 36.3167, "lng": 7.1667},
    {"name": "Bouchegouf", "city": "Bouchegouf", "state": "Guelma", "lat": 36.4667, "lng": 7.7167},
    {"name": "Hammam Debagh", "city": "Hammam Debagh", "state": "Guelma", "lat": 36.4597, "lng": 7.2714},
    {"name": "Sedrata", "city": "Sedrata", "state": "Souk Ahras", "lat": 36.1283, "lng": 7.5336},
    {"name": "M'Daourouch", "city": "M'Daourouch", "state": "Souk Ahras", "lat": 36.0747, "lng": 7.8208},
    {"name": "Taoura", "city": "Taoura", "state": "Souk Ahras", "lat": 36.1667, "lng": 8.0500},

    # --- TÉBESSA & KHENCHELA ---
    {"name": "Cheria", "city": "Cheria", "state": "Tébessa", "lat": 35.2719, "lng": 7.7519},
    {"name": "Bir El Ater", "city": "Bir El Ater", "state": "Tébessa", "lat": 34.7500, "lng": 8.0667},
    {"name": "Ouenza", "city": "Ouenza", "state": "Tébessa", "lat": 35.9667, "lng": 8.2333},
    {"name": "Chechar", "city": "Chechar", "state": "Khenchela", "lat": 35.0333, "lng": 7.0333},
    {"name": "Kais", "city": "Kais", "state": "Khenchela", "lat": 35.4833, "lng": 6.9167},
    {"name": "Babar", "city": "Babar", "state": "Khenchela", "lat": 35.1667, "lng": 7.1167},

    # --- BISKRA & OULED DJELLAL ---
    {"name": "Tolga", "city": "Tolga", "state": "Biskra", "lat": 34.7214, "lng": 5.3789},
    {"name": "Sidi Okba", "city": "Sidi Okba", "state": "Biskra", "lat": 34.7478, "lng": 5.8986},
    {"name": "Zeribet El Oued", "city": "Zeribet El Oued", "state": "Biskra", "lat": 34.6833, "lng": 6.5000},
    {"name": "El Kantara", "city": "El Kantara", "state": "Biskra", "lat": 35.2269, "lng": 5.7028},
    {"name": "Sidi Khaled", "city": "Sidi Khaled", "state": "Ouled Djellal", "lat": 34.3833, "lng": 4.9833},

    # --- DJELFA & M'SILA ---
    {"name": "Ain Oussera", "city": "Ain Oussera", "state": "Djelfa", "lat": 35.4506, "lng": 2.9056},
    {"name": "Messaad", "city": "Messaad", "state": "Djelfa", "lat": 34.1569, "lng": 3.5033},
    {"name": "Hassi Bahbah", "city": "Hassi Bahbah", "state": "Djelfa", "lat": 35.0767, "lng": 3.0306},
    {"name": "Dar Chioukh", "city": "Dar Chioukh", "state": "Djelfa", "lat": 34.8833, "lng": 3.4833},
    {"name": "Boussaada", "city": "Boussaada", "state": "M'Sila", "lat": 35.2139, "lng": 4.1750},
    {"name": "Sidi Aissa", "city": "Sidi Aissa", "state": "M'Sila", "lat": 35.8850, "lng": 3.6128},
    {"name": "Magra", "city": "Magra", "state": "M'Sila", "lat": 35.6000, "lng": 5.0667},
    {"name": "Berhoum", "city": "Berhoum", "state": "M'Sila", "lat": 35.6500, "lng": 5.0333},

    # --- BORDJ BOU ARRÉRIDJ ---
    {"name": "Ras El Oued", "city": "Ras El Oued", "state": "Bordj Bou Arréridj", "lat": 35.9428, "lng": 5.0319},
    {"name": "Mansoura BBA", "city": "Mansoura", "state": "Bordj Bou Arréridj", "lat": 36.0833, "lng": 4.6000},
    {"name": "Bordj Zemoura", "city": "Bordj Zemoura", "state": "Bordj Bou Arréridj", "lat": 36.2736, "lng": 4.8569},

    # --- OUARGLA, HASSI MESSAOUD, TOUGGOURT ---
    {"name": "Hassi Messaoud", "city": "Hassi Messaoud", "state": "Ouargla", "lat": 31.6803, "lng": 6.0728},
    {"name": "Rouissat", "city": "Rouissat", "state": "Ouargla", "lat": 31.9214, "lng": 5.3489},
    {"name": "N'Goussa", "city": "N'Goussa", "state": "Ouargla", "lat": 32.1408, "lng": 5.3056},
    {"name": "El Hadjira", "city": "El Hadjira", "state": "Touggourt", "lat": 32.6167, "lng": 5.5167},
    {"name": "Taibet", "city": "Taibet", "state": "Touggourt", "lat": 33.0833, "lng": 6.3833},

    # --- GHARDAÏA & LAGHOUAT ---
    {"name": "Metlili", "city": "Metlili", "state": "Ghardaïa", "lat": 32.2683, "lng": 3.6278},
    {"name": "El Guerara", "city": "El Guerara", "state": "Ghardaïa", "lat": 32.7917, "lng": 4.4917},
    {"name": "Berriane", "city": "Berriane", "state": "Ghardaïa", "lat": 32.8333, "lng": 3.7667},
    {"name": "Beni Isguen", "city": "Beni Isguen", "state": "Ghardaïa", "lat": 32.4772, "lng": 3.6842},
    {"name": "Aflou", "city": "Aflou", "state": "Laghouat", "lat": 34.1167, "lng": 2.1000},
    {"name": "Ksar El Hirane", "city": "Ksar El Hirane", "state": "Laghouat", "lat": 33.7833, "lng": 3.1333},
    {"name": "Ain Madhi", "city": "Ain Madhi", "state": "Laghouat", "lat": 33.8000, "lng": 2.3000},

    # --- BÉCHAR & BÉNI ABBÈS ---
    {"name": "Kenadsa", "city": "Kenadsa", "state": "Béchar", "lat": 31.5667, "lng": -2.4167},
    {"name": "Abadla", "city": "Abadla", "state": "Béchar", "lat": 31.0167, "lng": -2.7333},
    {"name": "Beni Ounif", "city": "Beni Ounif", "state": "Béchar", "lat": 32.0500, "lng": -1.2500},
    {"name": "Taghit", "city": "Taghit", "state": "Béchar", "lat": 30.9167, "lng": -2.0333},
    {"name": "Kerzaz", "city": "Kerzaz", "state": "Béni Abbès", "lat": 29.4500, "lng": -1.4167},

    # --- ADRAR & TIMIMOUN ---
    {"name": "Reggane", "city": "Reggane", "state": "Adrar", "lat": 26.7167, "lng": 0.1667},
    {"name": "Aoulef", "city": "Aoulef", "state": "Adrar", "lat": 26.9667, "lng": 1.0833},
    {"name": "Zaouiat Kounta", "city": "Zaouiat Kounta", "state": "Adrar", "lat": 27.2167, "lng": -0.2000},
    {"name": "Tsabit", "city": "Tsabit", "state": "Adrar", "lat": 28.2333, "lng": -0.3000},

    # --- EL OUED & EL M'GHAIR ---
    {"name": "Guemar", "city": "Guemar", "state": "El Oued", "lat": 33.4939, "lng": 6.7978},
    {"name": "Robbah", "city": "Robbah", "state": "El Oued", "lat": 33.2833, "lng": 6.8333},
    {"name": "Debila", "city": "Debila", "state": "El Oued", "lat": 33.5167, "lng": 6.9500},
    {"name": "Djamaa", "city": "Djamaa", "state": "El M'Ghair", "lat": 33.5333, "lng": 5.9833},

    # --- RELIZANE & AÏN DEFLA ---
    {"name": "Oued Rhiou", "city": "Oued Rhiou", "state": "Relizane", "lat": 35.9619, "lng": 0.9189},
    {"name": "Mazouna", "city": "Mazouna", "state": "Relizane", "lat": 36.1264, "lng": 0.8756},
    {"name": "Yellel", "city": "Yellel", "state": "Relizane", "lat": 35.7208, "lng": 0.3542},
    {"name": "Ammi Moussa", "city": "Ammi Moussa", "state": "Relizane", "lat": 35.8667, "lng": 1.1167},
    {"name": "Khemis Miliana", "city": "Khemis Miliana", "state": "Aïn Defla", "lat": 36.2611, "lng": 2.2203},
    {"name": "Miliana", "city": "Miliana", "state": "Aïn Defla", "lat": 36.3000, "lng": 2.2333},
    {"name": "El Attaf", "city": "El Attaf", "state": "Aïn Defla", "lat": 36.2239, "lng": 1.6719},
    {"name": "Djelida", "city": "Djelida", "state": "Aïn Defla", "lat": 36.2000, "lng": 2.0833},

    # --- NAÂMA & EL BAYADH ---
    {"name": "Mecheria", "city": "Mecheria", "state": "Naâma", "lat": 33.5469, "lng": -0.2764},
    {"name": "Ain Sefra", "city": "Ain Sefra", "state": "Naâma", "lat": 32.7500, "lng": -0.5833},
    {"name": "Tiout", "city": "Tiout", "state": "Naâma", "lat": 32.7667, "lng": -0.4167},
    {"name": "Labiodh Sidi Cheikh", "city": "Labiodh Sidi Cheikh", "state": "El Bayadh", "lat": 32.8833, "lng": 0.9500},
    {"name": "Brezina", "city": "Brezina", "state": "El Bayadh", "lat": 33.1000, "lng": 1.2667},
    {"name": "Rogassa", "city": "Rogassa", "state": "El Bayadh", "lat": 34.0167, "lng": 0.9833},

    # --- MILA & OUM EL BOUAGHI ---
    {"name": "Chelghoum Laid", "city": "Chelghoum Laid", "state": "Mila", "lat": 36.1628, "lng": 6.1667},
    {"name": "Tadjenanet", "city": "Tadjenanet", "state": "Mila", "lat": 36.1264, "lng": 5.9869},
    {"name": "Ferdjioua", "city": "Ferdjioua", "state": "Mila", "lat": 36.3986, "lng": 5.9286},
    {"name": "Ain M'lila", "city": "Ain M'lila", "state": "Oum El Bouaghi", "lat": 36.0333, "lng": 6.5833},
    {"name": "Ain Beida", "city": "Ain Beida", "state": "Oum El Bouaghi", "lat": 35.7964, "lng": 7.3928},
    {"name": "Ain Fakroun", "city": "Ain Fakroun", "state": "Oum El Bouaghi", "lat": 35.9667, "lng": 6.8667},

    # --- SUD & SAHARA ---
    {"name": "Aéroport Djanet Tiska", "city": "Djanet", "state": "Djanet", "lat": 24.4239, "lng": 9.4533},
    {"name": "Aéroport Tamanrasset Aguennar", "city": "Tamanrasset", "state": "Tamanrasset", "lat": 22.8114, "lng": 5.4511},
    {"name": "Aéroport In Salah", "city": "In Salah", "state": "In Salah", "lat": 27.2508, "lng": 2.5122},
    {"name": "Aéroport Ghardaïa Noumérat", "city": "Ghardaïa", "state": "Ghardaïa", "lat": 32.3842, "lng": 3.7942},
    {"name": "Aéroport Hassi Messaoud Oued Irara", "city": "Hassi Messaoud", "state": "Ouargla", "lat": 31.6728, "lng": 6.1403},
    {"name": "Aéroport Biskra Mohamed Khider", "city": "Biskra", "state": "Biskra", "lat": 34.7933, "lng": 5.7381},
]

def seed():
    print(f"Total places to insert: {len(PLACES_DATA)}")
    assert len(PLACES_DATA) <= 350, f"Error: {len(PLACES_DATA)} exceeds 350 places limit!"
    
    count = 0
    for item in PLACES_DATA:
        formatted = f"{item['name']}, {item['city']}, {item['state']}, Algérie"
        place, created = VtcPlace.objects.update_or_create(
            name=item['name'],
            city=item['city'],
            defaults={
                'formatted_address': formatted,
                'state': item['state'],
                'state_short': item['state'],
                'latitude': item['lat'],
                'longitude': item['lng'],
            }
        )
        count += 1
    
    total = VtcPlace.objects.count()
    print(f"Successfully processed {count} places. Total in DB: {total}")

if __name__ == '__main__':
    seed()
