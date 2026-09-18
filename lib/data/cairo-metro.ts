/**
 * Cairo Metro Stations Database with exact GPS Coordinates, Lines, and Interchanges.
 * Designed specifically for Egyptian blind navigation in Noor Dahab.
 */

export interface MetroStation {
  id: string;
  nameAr: string;
  line: 1 | 2 | 3;
  lineNameAr: string;
  lat: number;
  lon: number;
  isInterchange?: boolean;
  interchangeWith?: number[];
  accessible?: boolean;
}

export const CAIRO_METRO_STATIONS: MetroStation[] = [
  // ── الخط الأول: حلوان - المرج الجديدة (Line 1: Helwan - El Marg) ──
  { id: "m1_helwan", nameAr: "حلوان", line: 1, lineNameAr: "الخط الأول (حلوان - المرج)", lat: 29.8492, lon: 31.3342 },
  { id: "m1_ain_helwan", nameAr: "عين حلوان", line: 1, lineNameAr: "الخط الأول", lat: 29.8622, lon: 31.3301 },
  { id: "m1_helwan_univ", nameAr: "جامعة حلوان", line: 1, lineNameAr: "الخط الأول", lat: 29.8698, lon: 31.3204 },
  { id: "m1_wadi_hof", nameAr: "وادي حوف", line: 1, lineNameAr: "الخط الأول", lat: 29.8821, lon: 31.3129 },
  { id: "m1_hadayek_helwan", nameAr: "حدائق حلوان", line: 1, lineNameAr: "الخط الأول", lat: 29.9015, lon: 31.3061 },
  { id: "m1_el_maasara", nameAr: "المعصرة", line: 1, lineNameAr: "الخط الأول", lat: 29.9148, lon: 31.3005 },
  { id: "m1_tora_el_asmant", nameAr: "طرة الأسمنت", line: 1, lineNameAr: "الخط الأول", lat: 29.9328, lon: 31.2891 },
  { id: "m1_kozzika", nameAr: "كوتسيكا", line: 1, lineNameAr: "الخط الأول", lat: 29.9442, lon: 31.2829 },
  { id: "m1_tora_el_balad", nameAr: "طرة البلد", line: 1, lineNameAr: "الخط الأول", lat: 29.9545, lon: 31.2778 },
  { id: "m1_sakanat_el_maadi", nameAr: "ثكنات المعادي", line: 1, lineNameAr: "الخط الأول", lat: 29.9538, lon: 31.2631 },
  { id: "m1_el_maadi", nameAr: "المعادي", line: 1, lineNameAr: "الخط الأول", lat: 29.9602, lon: 31.2581 },
  { id: "m1_hadayek_el_maadi", nameAr: "حدائق المعادي", line: 1, lineNameAr: "الخط الأول", lat: 29.9723, lon: 31.2492 },
  { id: "m1_dar_el_salam", nameAr: "دار السلام", line: 1, lineNameAr: "الخط الأول", lat: 29.9868, lon: 31.2415 },
  { id: "m1_el_zahraa", nameAr: "الزهراء", line: 1, lineNameAr: "الخط الأول", lat: 30.0031, lon: 31.2338 },
  { id: "m1_mar_girgis", nameAr: "مار جرجس", line: 1, lineNameAr: "الخط الأول", lat: 30.0064, lon: 31.2301 },
  { id: "m1_el_malek_el_saleh", nameAr: "الملك الصالح", line: 1, lineNameAr: "الخط الأول", lat: 30.0152, lon: 31.2292 },
  { id: "m1_al_sayeda_zeinab", nameAr: "السيدة زينب", line: 1, lineNameAr: "الخط الأول", lat: 30.0298, lon: 31.2359 },
  { id: "m1_saad_zaghloul", nameAr: "سعد زغلول", line: 1, lineNameAr: "الخط الأول", lat: 30.0367, lon: 31.2386 },
  { id: "m1_sadat", nameAr: "السادات (ميدان التحرير)", line: 1, lineNameAr: "الخط الأول والثاني", lat: 30.0444, lon: 31.2357, isInterchange: true, interchangeWith: [2] },
  { id: "m1_gamal_abd_el_nasser", nameAr: "جمال عبد الناصر (وسط البلد)", line: 1, lineNameAr: "الخط الأول والثالث", lat: 30.0527, lon: 31.2411, isInterchange: true, interchangeWith: [3] },
  { id: "m1_urabi", nameAr: "أحمد عرابي", line: 1, lineNameAr: "الخط الأول", lat: 30.0578, lon: 31.2443 },
  { id: "m1_shohadaa", nameAr: "الشهداء (ميدان رمسيس)", line: 1, lineNameAr: "الخط الأول والثاني", lat: 30.0617, lon: 31.2494, isInterchange: true, interchangeWith: [2] },
  { id: "m1_ghamra", nameAr: "غمرة", line: 1, lineNameAr: "الخط الأول", lat: 30.0673, lon: 31.2682 },
  { id: "m1_el_demerdash", nameAr: "الدمرداش", line: 1, lineNameAr: "الخط الأول", lat: 30.0768, lon: 31.2774 },
  { id: "m1_manshiet_el_sadr", nameAr: "منشية الصدر", line: 1, lineNameAr: "الخط الأول", lat: 30.0842, lon: 31.2858 },
  { id: "m1_kobry_el_qobba", nameAr: "كوبري القبة", line: 1, lineNameAr: "الخط الأول", lat: 30.0894, lon: 31.2941 },
  { id: "m1_hammamat_el_qobba", nameAr: "حمامات القبة", line: 1, lineNameAr: "الخط الأول", lat: 30.0931, lon: 31.3005 },
  { id: "m1_saray_el_qobba", nameAr: "سراي القبة", line: 1, lineNameAr: "الخط الأول", lat: 30.0991, lon: 31.3082 },
  { id: "m1_hadayek_el_zaitoun", nameAr: "حدائق الزيتون", line: 1, lineNameAr: "الخط الأول", lat: 30.1068, lon: 31.3148 },
  { id: "m1_helmeyat_el_zaitoun", nameAr: "حلمية الزيتون", line: 1, lineNameAr: "الخط الأول", lat: 30.1147, lon: 31.3188 },
  { id: "m1_el_matareya", nameAr: "المطرية", line: 1, lineNameAr: "الخط الأول", lat: 30.1232, lon: 31.3168 },
  { id: "m1_ain_shams", nameAr: "عين شمس", line: 1, lineNameAr: "الخط الأول", lat: 30.1311, lon: 31.3175 },
  { id: "m1_ezbet_el_nakhl", nameAr: "عزبة النخل", line: 1, lineNameAr: "الخط الأول", lat: 30.1398, lon: 31.3242 },
  { id: "m1_el_marg", nameAr: "المرج القديمة", line: 1, lineNameAr: "الخط الأول", lat: 30.1524, lon: 31.3355 },
  { id: "m1_new_el_marg", nameAr: "المرج الجديدة", line: 1, lineNameAr: "الخط الأول", lat: 30.1639, lon: 31.3392 },

  // ── الخط الثاني: شبرا الخيمة - المنيب (Line 2: Shubra - El Mounib) ──
  { id: "m2_shubra_el_kheima", nameAr: "شبرا الخيمة", line: 2, lineNameAr: "الخط الثاني", lat: 30.1231, lon: 31.2452 },
  { id: "m2_kolleyet_el_zeraa", nameAr: "كلية الزراعة", line: 2, lineNameAr: "الخط الثاني", lat: 30.1132, lon: 31.2498 },
  { id: "m2_el_mezallat", nameAr: "المظلات", line: 2, lineNameAr: "الخط الثاني", lat: 30.0988, lon: 31.2461 },
  { id: "m2_el_khalafawi", nameAr: "الخلفاوي", line: 2, lineNameAr: "الخط الثاني", lat: 30.0901, lon: 31.2455 },
  { id: "m2_st_teresa", nameAr: "سانت تريزا", line: 2, lineNameAr: "الخط الثاني", lat: 30.0825, lon: 31.2459 },
  { id: "m2_rod_el_farag", nameAr: "روض الفرج", line: 2, lineNameAr: "الخط الثاني", lat: 30.0734, lon: 31.2464 },
  { id: "m2_massara", nameAr: "مسرة", line: 2, lineNameAr: "الخط الثاني", lat: 30.0671, lon: 31.2472 },
  { id: "m2_ataba", nameAr: "العتبة", line: 2, lineNameAr: "الخط الثاني والثالث", lat: 30.0526, lon: 31.2478, isInterchange: true, interchangeWith: [3] },
  { id: "m2_mohamed_naguib", nameAr: "محمد نجيب (عابدين)", line: 2, lineNameAr: "الخط الثاني", lat: 30.0461, lon: 31.2427 },
  { id: "m2_opera", nameAr: "الأوبرا (الجزيرة والزمالك)", line: 2, lineNameAr: "الخط الثاني", lat: 30.0425, lon: 31.2248 },
  { id: "m2_dokki", nameAr: "الدقي", line: 2, lineNameAr: "الخط الثاني", lat: 30.0385, lon: 31.2124 },
  { id: "m2_el_bohoos", nameAr: "البحوث", line: 2, lineNameAr: "الخط الثاني", lat: 30.0358, lon: 31.2001 },
  { id: "m2_cairo_univ", nameAr: "جامعة القاهرة", line: 2, lineNameAr: "الخط الثاني والثالث", lat: 30.0264, lon: 31.2012, isInterchange: true, interchangeWith: [3] },
  { id: "m2_faisal", nameAr: "فيصل", line: 2, lineNameAr: "الخط الثاني", lat: 30.0169, lon: 31.2038 },
  { id: "m2_giza", nameAr: "الجيزة (محطة قطار الجيزة)", line: 2, lineNameAr: "الخط الثاني", lat: 30.0105, lon: 31.2071 },
  { id: "m2_om_el_masryeen", nameAr: "أم المصريين (ضواحي الجيزة)", line: 2, lineNameAr: "الخط الثاني", lat: 30.0041, lon: 31.2088 },
  { id: "m2_sakiat_mekki", nameAr: "ساقية مكي", line: 2, lineNameAr: "الخط الثاني", lat: 29.9958, lon: 31.2104 },
  { id: "m2_el_mounib", nameAr: "المنيب", line: 2, lineNameAr: "الخط الثاني", lat: 29.9818, lon: 31.2119 },

  // ── الخط الثالث: عدلي منصور - الكيت كات - جامعة القاهرة (Line 3: Green Line) ──
  { id: "m3_adly_mansour", nameAr: "عدلي منصور (المحطة المركزية)", line: 3, lineNameAr: "الخط الثالث", lat: 30.1472, lon: 31.4208, isInterchange: true },
  { id: "m3_el_haykestep", nameAr: "الهايكستب", line: 3, lineNameAr: "الخط الثالث", lat: 30.1382, lon: 31.3985 },
  { id: "m3_omar_ibn_el_khattab", nameAr: "عمر بن الخطاب", line: 3, lineNameAr: "الخط الثالث", lat: 30.1321, lon: 31.3854 },
  { id: "m3_kebaa", nameAr: "قباء", line: 3, lineNameAr: "الخط الثالث", lat: 30.1284, lon: 31.3742 },
  { id: "m3_hesham_barakat", nameAr: "هشام بركات", line: 3, lineNameAr: "الخط الثالث", lat: 30.1241, lon: 31.3621 },
  { id: "m3_el_nozha", nameAr: "النزهة", line: 3, lineNameAr: "الخط الثالث", lat: 30.1189, lon: 31.3508 },
  { id: "m3_el_shams_club", nameAr: "نادي الشمس", line: 3, lineNameAr: "الخط الثالث", lat: 30.1141, lon: 31.3412 },
  { id: "m3_alf_maskan", nameAr: "ألف مسكن", line: 3, lineNameAr: "الخط الثالث", lat: 30.1182, lon: 31.3325 },
  { id: "m3_heliopolis", nameAr: "هليوبوليس (مصر الجديدة)", line: 3, lineNameAr: "الخط الثالث", lat: 30.1082, lon: 31.3289 },
  { id: "m3_haroun", nameAr: "هارون الرشيد", line: 3, lineNameAr: "الخط الثالث", lat: 30.1018, lon: 31.3312 },
  { id: "m3_ahram", nameAr: "الأهرام (الكوربة)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0921, lon: 31.3245 },
  { id: "m3_koleyet_el_banat", nameAr: "كلية البنات", line: 3, lineNameAr: "الخط الثالث", lat: 30.0841, lon: 31.3235 },
  { id: "m3_stadium", nameAr: "ستاد القاهرة (مدينة نصر)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0735, lon: 31.3142 },
  { id: "m3_fair_zone", nameAr: "أرض المعارض", line: 3, lineNameAr: "الخط الثالث", lat: 30.0725, lon: 31.3005 },
  { id: "m3_abbassiya", nameAr: "العباسية", line: 3, lineNameAr: "الخط الثالث", lat: 30.0682, lon: 31.2862 },
  { id: "m3_abdou_pasha", nameAr: "عبده باشا", line: 3, lineNameAr: "الخط الثالث", lat: 30.0631, lon: 31.2785 },
  { id: "m3_el_geish", nameAr: "الجيش (باب الشعرية)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0571, lon: 31.2662 },
  { id: "m3_bab_el_shaariya", nameAr: "باب الشعرية", line: 3, lineNameAr: "الخط الثالث", lat: 30.0542, lon: 31.2581 },
  { id: "m3_maspero", nameAr: "ماسبيرو (كورنيش النيل)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0558, lon: 31.2335 },
  { id: "m3_safaa_hegazy", nameAr: "صفاء حجازي (الزمالك)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0621, lon: 31.2225 },
  { id: "m3_kit_kat", nameAr: "الكيت كات", line: 3, lineNameAr: "الخط الثالث", lat: 30.0645, lon: 31.2132, isInterchange: true },
  { id: "m3_sudan", nameAr: "السودان", line: 3, lineNameAr: "الخط الثالث", lat: 30.0662, lon: 31.2031 },
  { id: "m3_imbaba", nameAr: "إمبابة", line: 3, lineNameAr: "الخط الثالث", lat: 30.0721, lon: 31.2065 },
  { id: "m3_bohy", nameAr: "البوهي", line: 3, lineNameAr: "الخط الثالث", lat: 30.0792, lon: 31.2081 },
  { id: "m3_qawmeya", nameAr: "القومية العربية", line: 3, lineNameAr: "الخط الثالث", lat: 30.0865, lon: 31.2095 },
  { id: "m3_ring_road", nameAr: "الطريق الدائري (محطة بشتيل)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0942, lon: 31.2078 },
  { id: "m3_rod_el_farag_corr", nameAr: "محور روض الفرج", line: 3, lineNameAr: "الخط الثالث", lat: 30.1031, lon: 31.2015 },
  { id: "m3_tawfikeya", nameAr: "التوفيقية (المهندسين)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0592, lon: 31.2052 },
  { id: "m3_wadi_el_nile", nameAr: "وادي النيل (ميدان لبنان)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0541, lon: 31.2025 },
  { id: "m3_gamat_el_dwal", nameAr: "جامعة الدول العربية (المهندسين)", line: 3, lineNameAr: "الخط الثالث", lat: 30.0482, lon: 31.2012 },
  { id: "m3_bolak_el_dakrour", nameAr: "بولاق الدكرور", line: 3, lineNameAr: "الخط الثالث", lat: 30.0381, lon: 31.1985 }
];
