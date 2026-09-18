/**
 * Cairo & Alexandria Metro & Transit Stations Database
 * Includes Line 1, Line 2, Line 3 (all 2024-2025 extension stations), and Alexandria Main Stations.
 */

export interface MetroStation {
  id: string;
  nameAr: string;
  city: "cairo" | "alexandria";
  line: 1 | 2 | 3 | 4; // 4 = Alexandria Tram/Train
  lineNameAr: string;
  lat: number;
  lon: number;
  isInterchange?: boolean;
  interchangeWith?: number[];
  accessible?: boolean;
}

export const TRANSIT_STATIONS: MetroStation[] = [
  // ── الخط الأول: حلوان - المرج الجديدة (Line 1: Helwan - El Marg) ──
  { id: "m1_helwan", nameAr: "حلوان", city: "cairo", line: 1, lineNameAr: "الخط الأول (حلوان - المرج)", lat: 29.8492, lon: 31.3342 },
  { id: "m1_ain_helwan", nameAr: "عين حلوان", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.8622, lon: 31.3301 },
  { id: "m1_helwan_univ", nameAr: "جامعة حلوان", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.8698, lon: 31.3204 },
  { id: "m1_wadi_hof", nameAr: "وادي حوف", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.8821, lon: 31.3129 },
  { id: "m1_hadayek_helwan", nameAr: "حدائق حلوان", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9015, lon: 31.3061 },
  { id: "m1_el_maasara", nameAr: "المعصرة", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9148, lon: 31.3005 },
  { id: "m1_tora_el_asmant", nameAr: "طرة الأسمنت", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9328, lon: 31.2891 },
  { id: "m1_kozzika", nameAr: "كوتسيكا", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9442, lon: 31.2829 },
  { id: "m1_tora_el_balad", nameAr: "طرة البلد", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9545, lon: 31.2778 },
  { id: "m1_sakanat_el_maadi", nameAr: "ثكنات المعادي", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9538, lon: 31.2631 },
  { id: "m1_el_maadi", nameAr: "المعادي", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9602, lon: 31.2581 },
  { id: "m1_hadayek_el_maadi", nameAr: "حدائق المعادي", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9723, lon: 31.2492 },
  { id: "m1_dar_el_salam", nameAr: "دار السلام", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 29.9868, lon: 31.2415 },
  { id: "m1_el_zahraa", nameAr: "الزهراء", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0031, lon: 31.2338 },
  { id: "m1_mar_girgis", nameAr: "مار جرجس (مصر القديمة)", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0064, lon: 31.2301 },
  { id: "m1_el_malek_el_saleh", nameAr: "الملك الصالح", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0152, lon: 31.2292 },
  { id: "m1_al_sayeda_zeinab", nameAr: "السيدة زينب", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0298, lon: 31.2359 },
  { id: "m1_saad_zaghloul", nameAr: "سعد زغلول (وسط البلد)", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0367, lon: 31.2386 },
  { id: "m1_sadat", nameAr: "السادات (ميدان التحرير)", city: "cairo", line: 1, lineNameAr: "الخط الأول والثاني", lat: 30.0444, lon: 31.2357, isInterchange: true, interchangeWith: [2] },
  { id: "m1_gamal_abd_el_nasser", nameAr: "جمال عبد الناصر (وسط البلد)", city: "cairo", line: 1, lineNameAr: "الخط الأول والثالث", lat: 30.0527, lon: 31.2411, isInterchange: true, interchangeWith: [3] },
  { id: "m1_urabi", nameAr: "أحمد عرابي", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0578, lon: 31.2443 },
  { id: "m1_shohadaa", nameAr: "الشهداء (ميدان رمسيس)", city: "cairo", line: 1, lineNameAr: "الخط الأول والثاني", lat: 30.0617, lon: 31.2494, isInterchange: true, interchangeWith: [2] },
  { id: "m1_ghamra", nameAr: "غمرة", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0673, lon: 31.2682 },
  { id: "m1_el_demerdash", nameAr: "الدمرداش", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0768, lon: 31.2774 },
  { id: "m1_manshiet_el_sadr", nameAr: "منشية الصدر", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0842, lon: 31.2858 },
  { id: "m1_kobry_el_qobba", nameAr: "كوبري القبة", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0894, lon: 31.2941 },
  { id: "m1_hammamat_el_qobba", nameAr: "حمامات القبة", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0931, lon: 31.3005 },
  { id: "m1_saray_el_qobba", nameAr: "سراي القبة", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.0991, lon: 31.3082 },
  { id: "m1_hadayek_el_zaitoun", nameAr: "حدائق الزيتون", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.1068, lon: 31.3148 },
  { id: "m1_helmeyat_el_zaitoun", nameAr: "حلمية الزيتون", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.1147, lon: 31.3188 },
  { id: "m1_el_matareya", nameAr: "المطرية", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.1232, lon: 31.3168 },
  { id: "m1_ain_shams", nameAr: "عين شمس", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.1311, lon: 31.3175 },
  { id: "m1_ezbet_el_nakhl", nameAr: "عزبة النخل", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.1398, lon: 31.3242 },
  { id: "m1_el_marg", nameAr: "المرج القديمة", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.1524, lon: 31.3355 },
  { id: "m1_new_el_marg", nameAr: "المرج الجديدة", city: "cairo", line: 1, lineNameAr: "الخط الأول", lat: 30.1639, lon: 31.3392 },

  // ── الخط الثاني: شبرا الخيمة - المنيب (Line 2: Shubra - El Mounib) ──
  { id: "m2_shubra_el_kheima", nameAr: "شبرا الخيمة", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.1231, lon: 31.2452 },
  { id: "m2_kolleyet_el_zeraa", nameAr: "كلية الزراعة", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.1132, lon: 31.2498 },
  { id: "m2_el_mezallat", nameAr: "المظلات", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0988, lon: 31.2461 },
  { id: "m2_el_khalafawi", nameAr: "الخلفاوي", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0901, lon: 31.2455 },
  { id: "m2_st_teresa", nameAr: "سانت تريزا", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0825, lon: 31.2459 },
  { id: "m2_rod_el_farag", nameAr: "روض الفرج", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0734, lon: 31.2464 },
  { id: "m2_massara", nameAr: "مسرة", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0671, lon: 31.2472 },
  { id: "m2_ataba", nameAr: "العتبة", city: "cairo", line: 2, lineNameAr: "الخط الثاني والثالث", lat: 30.0526, lon: 31.2478, isInterchange: true, interchangeWith: [3] },
  { id: "m2_mohamed_naguib", nameAr: "محمد نجيب (عابدين)", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0461, lon: 31.2427 },
  { id: "m2_opera", nameAr: "الأوبرا (الجزيرة والزمالك)", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0425, lon: 31.2248 },
  { id: "m2_dokki", nameAr: "الدقي", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0385, lon: 31.2124 },
  { id: "m2_el_bohoos", nameAr: "البحوث", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0358, lon: 31.2001 },
  { id: "m2_cairo_univ", nameAr: "جامعة القاهرة", city: "cairo", line: 2, lineNameAr: "الخط الثاني والثالث", lat: 30.0264, lon: 31.2012, isInterchange: true, interchangeWith: [3] },
  { id: "m2_faisal", nameAr: "فيصل", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0169, lon: 31.2038 },
  { id: "m2_giza", nameAr: "الجيزة (محطة قطار الجيزة)", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0105, lon: 31.2071 },
  { id: "m2_om_el_masryeen", nameAr: "أم المصريين (ضواحي الجيزة)", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 30.0041, lon: 31.2088 },
  { id: "m2_sakiat_mekki", nameAr: "ساقية مكي", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 29.9958, lon: 31.2104 },
  { id: "m2_el_mounib", nameAr: "المنيب", city: "cairo", line: 2, lineNameAr: "الخط الثاني", lat: 29.9818, lon: 31.2119 },

  // ── الخط الثالث: عدلي منصور - الكيت كات - جامعة القاهرة ومحور روض الفرج ──
  { id: "m3_adly_mansour", nameAr: "عدلي منصور (المحطة المركزية)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1472, lon: 31.4208, isInterchange: true },
  { id: "m3_el_haykestep", nameAr: "الهايكستب", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1382, lon: 31.3985 },
  { id: "m3_omar_ibn_el_khattab", nameAr: "عمر بن الخطاب", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1321, lon: 31.3854 },
  { id: "m3_kebaa", nameAr: "قباء", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1284, lon: 31.3742 },
  { id: "m3_hesham_barakat", nameAr: "هشام بركات", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1241, lon: 31.3621 },
  { id: "m3_el_nozha", nameAr: "النزهة", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1189, lon: 31.3508 },
  { id: "m3_el_shams_club", nameAr: "نادي الشمس", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1141, lon: 31.3412 },
  { id: "m3_alf_maskan", nameAr: "ألف مسكن", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1182, lon: 31.3325 },
  { id: "m3_heliopolis", nameAr: "هليوبوليس (مصر الجديدة)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1082, lon: 31.3289 },
  { id: "m3_haroun", nameAr: "هارون الرشيد", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1018, lon: 31.3312 },
  { id: "m3_ahram", nameAr: "الأهرام (الكوربة)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0921, lon: 31.3245 },
  { id: "m3_koleyet_el_banat", nameAr: "كلية البنات", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0841, lon: 31.3235 },
  { id: "m3_stadium", nameAr: "ستاد القاهرة (مدينة نصر)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0735, lon: 31.3142 },
  { id: "m3_fair_zone", nameAr: "أرض المعارض", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0725, lon: 31.3005 },
  { id: "m3_abbassiya", nameAr: "العباسية", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0682, lon: 31.2862 },
  { id: "m3_abdou_pasha", nameAr: "عبده باشا", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0631, lon: 31.2785 },
  { id: "m3_el_geish", nameAr: "الجيش (باب الشعرية)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0571, lon: 31.2662 },
  { id: "m3_bab_el_shaariya", nameAr: "باب الشعرية", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0542, lon: 31.2581 },
  { id: "m3_maspero", nameAr: "ماسبيرو (كورنيش النيل)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0558, lon: 31.2335 },
  { id: "m3_safaa_hegazy", nameAr: "صفاء حجازي (الزمالك)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0621, lon: 31.2225 },
  { id: "m3_kit_kat", nameAr: "الكيت كات", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0645, lon: 31.2132, isInterchange: true },
  { id: "m3_sudan", nameAr: "السودان", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0662, lon: 31.2031 },
  { id: "m3_imbaba", nameAr: "إمبابة", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0721, lon: 31.2065 },
  { id: "m3_bohy", nameAr: "البوهي", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0792, lon: 31.2081 },
  { id: "m3_qawmeya", nameAr: "القومية العربية", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0865, lon: 31.2095 },
  { id: "m3_bashteel", nameAr: "محطة قطارات صعيد مصر (بشتيل)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0912, lon: 31.2085, isInterchange: true },
  { id: "m3_ring_road", nameAr: "الطريق الدائري", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0942, lon: 31.2078 },
  { id: "m3_rod_el_farag_corr", nameAr: "محور روض الفرج", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.1031, lon: 31.2015 },
  { id: "m3_tawfikeya", nameAr: "التوفيقية (المهندسين)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0592, lon: 31.2052 },
  { id: "m3_wadi_el_nile", nameAr: "وادي النيل (ميدان لبنان)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0541, lon: 31.2025 },
  { id: "m3_gamat_el_dwal", nameAr: "جامعة الدول العربية (المهندسين)", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0482, lon: 31.2012 },
  { id: "m3_bolak_el_dakrour", nameAr: "بولاق الدكرور", city: "cairo", line: 3, lineNameAr: "الخط الثالث", lat: 30.0381, lon: 31.1985 },

  // ── محطات الإسكندرية الرئيسية (Alexandria Transit & Metro Project) ──
  { id: "alx_masr_station", nameAr: "محطة مصر الإسكندرية (المحطة المركزية)", city: "alexandria", line: 4, lineNameAr: "قطار وترام الإسكندرية", lat: 31.1925, lon: 29.9058, isInterchange: true },
  { id: "alx_sidi_gaber", nameAr: "سيدي جابر (المحطة الرئيسية)", city: "alexandria", line: 4, lineNameAr: "قطار وترام الإسكندرية", lat: 31.2185, lon: 29.9419, isInterchange: true },
  { id: "alx_raml_station", nameAr: "محطة الرمل (ميدان سعد زغلول)", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية", lat: 31.1998, lon: 29.9008, isInterchange: true },
  { id: "alx_sporting", nameAr: "سبورتنج", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية", lat: 31.2142, lon: 29.9312 },
  { id: "alx_cleopatra", nameAr: "كليوباترا", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية", lat: 31.2235, lon: 29.9482 },
  { id: "alx_roushdy", nameAr: "رشدي", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية", lat: 31.2312, lon: 29.9575 },
  { id: "alx_stanley", nameAr: "ستانلي (كوبري ستانلي)", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية", lat: 31.2355, lon: 29.9612 },
  { id: "alx_saba_pasha", nameAr: "سابا باشا", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية", lat: 31.2401, lon: 29.9685 },
  { id: "alx_gleem", nameAr: "جليم", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية", lat: 31.2435, lon: 29.9742 },
  { id: "alx_victoria", nameAr: "فيكتوريا", city: "alexandria", line: 4, lineNameAr: "ترام الإسكندرية وقطار أبو قير", lat: 31.2512, lon: 29.9885, isInterchange: true },
  { id: "alx_mandara", nameAr: "المندرة", city: "alexandria", line: 4, lineNameAr: "قطار وترام الإسكندرية", lat: 31.2785, lon: 30.0152 },
  { id: "alx_asafra", nameAr: "العصافرة", city: "alexandria", line: 4, lineNameAr: "قطار الإسكندرية", lat: 31.2698, lon: 30.0051 },
  { id: "alx_miami", nameAr: "ميامي (شارع جمال عبد الناصر)", city: "alexandria", line: 4, lineNameAr: "محطة ميامي", lat: 31.2642, lon: 29.9985 },
  { id: "alx_montaza", nameAr: "المنتزه (قصر المنتزه)", city: "alexandria", line: 4, lineNameAr: "قطار الإسكندرية", lat: 31.2855, lon: 30.0242 },
  { id: "alx_mamoura", nameAr: "المعمورة", city: "alexandria", line: 4, lineNameAr: "قطار الإسكندرية", lat: 31.2952, lon: 30.0385 },
  { id: "alx_abu_qir", nameAr: "أبو قير (المحطة النهائية)", city: "alexandria", line: 4, lineNameAr: "مترو وقطار أبو قير", lat: 31.3175, lon: 30.0621 }
];

export const CAIRO_METRO_STATIONS = TRANSIT_STATIONS;
