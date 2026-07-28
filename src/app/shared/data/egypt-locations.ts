// Adapted from open-admin-data/egypt-administrative-divisions (CC BY 4.0).
// Source snapshot: 2026-06-01 · https://github.com/open-admin-data/egypt-administrative-divisions

export interface EgyptDistrict {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface EgyptGovernorate {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly districts: readonly EgyptDistrict[];
}

export const EGYPT_GOVERNORATES: readonly EgyptGovernorate[] = 
[
    {
        "id":  "EG01",
        "name":  "القاهرة",
        "latitude":  29.966,
        "longitude":  31.573,
        "districts":  [
                          {
                              "id":  "EG0100",
                              "name":  "خارج الزمام",
                              "latitude":  29.972,
                              "longitude":  31.799
                          },
                          {
                              "id":  "EG0103",
                              "name":  "قسم 15 مايو",
                              "latitude":  29.853,
                              "longitude":  31.387
                          },
                          {
                              "id":  "EG0113",
                              "name":  "قسم الأزبكية",
                              "latitude":  30.06,
                              "longitude":  31.246
                          },
                          {
                              "id":  "EG0135",
                              "name":  "قسم البساتين",
                              "latitude":  29.98,
                              "longitude":  31.293
                          },
                          {
                              "id":  "EG0101",
                              "name":  "قسم التبين",
                              "latitude":  29.781,
                              "longitude":  31.337
                          },
                          {
                              "id":  "EG0115",
                              "name":  "قسم الجمالية",
                              "latitude":  30.054,
                              "longitude":  31.265
                          },
                          {
                              "id":  "EG0108",
                              "name":  "قسم الخليفة",
                              "latitude":  30.01,
                              "longitude":  31.296
                          },
                          {
                              "id":  "EG0114",
                              "name":  "قسم الدرب الأحمر",
                              "latitude":  30.041,
                              "longitude":  31.26
                          },
                          {
                              "id":  "EG0131",
                              "name":  "قسم الزاويةالحمراء",
                              "latitude":  30.098,
                              "longitude":  31.27
                          },
                          {
                              "id":  "EG0133",
                              "name":  "قسم الزمالك",
                              "latitude":  30.056,
                              "longitude":  31.223
                          },
                          {
                              "id":  "EG0124",
                              "name":  "قسم الزيتون",
                              "latitude":  30.1,
                              "longitude":  31.301
                          },
                          {
                              "id":  "EG0121",
                              "name":  "قسم الساحل",
                              "latitude":  30.092,
                              "longitude":  31.247
                          },
                          {
                              "id":  "EG0132",
                              "name":  "قسم السلام",
                              "latitude":  30.162,
                              "longitude":  31.428
                          },
                          {
                              "id":  "EG0107",
                              "name":  "قسم السيدة زينب",
                              "latitude":  30.03,
                              "longitude":  31.242
                          },
                          {
                              "id":  "EG0118",
                              "name":  "قسم الشرابية",
                              "latitude":  30.082,
                              "longitude":  31.264
                          },
                          {
                              "id":  "EG0140",
                              "name":  "قسم الشروق",
                              "latitude":  30.133,
                              "longitude":  31.547
                          },
                          {
                              "id":  "EG0117",
                              "name":  "قسم الظاهر",
                              "latitude":  30.063,
                              "longitude":  31.268
                          },
                          {
                              "id":  "EG0136",
                              "name":  "قسم المرج",
                              "latitude":  30.156,
                              "longitude":  31.346
                          },
                          {
                              "id":  "EG0125",
                              "name":  "قسم المطرية",
                              "latitude":  30.128,
                              "longitude":  31.304
                          },
                          {
                              "id":  "EG0104",
                              "name":  "قسم المعادي",
                              "latitude":  29.963,
                              "longitude":  31.368
                          },
                          {
                              "id":  "EG0110",
                              "name":  "قسم الموسكي",
                              "latitude":  30.05,
                              "longitude":  31.252
                          },
                          {
                              "id":  "EG0129",
                              "name":  "قسم النزهة",
                              "latitude":  30.115,
                              "longitude":  31.389
                          },
                          {
                              "id":  "EG0122",
                              "name":  "قسم الوايلي",
                              "latitude":  30.072,
                              "longitude":  31.283
                          },
                          {
                              "id":  "EG0137",
                              "name":  "قسم أول القاهرة الجديدة",
                              "latitude":  30.024,
                              "longitude":  31.55
                          },
                          {
                              "id":  "EG0126",
                              "name":  "قسم أول مدينة نصر",
                              "latitude":  30.032,
                              "longitude":  31.369
                          },
                          {
                              "id":  "EG0116",
                              "name":  "قسم باب الشعرية",
                              "latitude":  30.059,
                              "longitude":  31.258
                          },
                          {
                              "id":  "EG0141",
                              "name":  "قسم بدر",
                              "latitude":  30.136,
                              "longitude":  31.706
                          },
                          {
                              "id":  "EG0112",
                              "name":  "قسم بولاق",
                              "latitude":  30.062,
                              "longitude":  31.234
                          },
                          {
                              "id":  "EG0139",
                              "name":  "قسم ثالث القاهرة الجديدة",
                              "latitude":  29.978,
                              "longitude":  31.456
                          },
                          {
                              "id":  "EG0138",
                              "name":  "قسم ثان القاهرة الجديدة",
                              "latitude":  30.074,
                              "longitude":  31.582
                          },
                          {
                              "id":  "EG0127",
                              "name":  "قسم ثانمدينةنصر",
                              "latitude":  30.048,
                              "longitude":  31.309
                          },
                          {
                              "id":  "EG0123",
                              "name":  "قسم حدائقالقبة",
                              "latitude":  30.086,
                              "longitude":  31.283
                          },
                          {
                              "id":  "EG0102",
                              "name":  "قسم حلوان",
                              "latitude":  29.854,
                              "longitude":  31.329
                          },
                          {
                              "id":  "EG0120",
                              "name":  "قسم روضالفرج",
                              "latitude":  30.075,
                              "longitude":  31.238
                          },
                          {
                              "id":  "EG0119",
                              "name":  "قسم شبرا",
                              "latitude":  30.072,
                              "longitude":  31.25
                          },
                          {
                              "id":  "EG0105",
                              "name":  "قسم طره",
                              "latitude":  29.939,
                              "longitude":  31.38
                          },
                          {
                              "id":  "EG0109",
                              "name":  "قسم عابدين",
                              "latitude":  30.046,
                              "longitude":  31.245
                          },
                          {
                              "id":  "EG0130",
                              "name":  "قسم عينشمس",
                              "latitude":  30.123,
                              "longitude":  31.33
                          },
                          {
                              "id":  "EG0111",
                              "name":  "قسم قصر النيل",
                              "latitude":  30.043,
                              "longitude":  31.235
                          },
                          {
                              "id":  "EG0128",
                              "name":  "قسم مصرالجديدة",
                              "latitude":  30.091,
                              "longitude":  31.327
                          },
                          {
                              "id":  "EG0106",
                              "name":  "مصرالقديمة",
                              "latitude":  30.006,
                              "longitude":  31.242
                          },
                          {
                              "id":  "EG0134",
                              "name":  "منشأةناصر",
                              "latitude":  30.043,
                              "longitude":  31.284
                          }
                      ]
    },
    {
        "id":  "EG02",
        "name":  "الإسكندرية",
        "latitude":  30.798,
        "longitude":  29.708,
        "districts":  [
                          {
                              "id":  "EG0215",
                              "name":  "اداره شرطه ميناء الأسكندريه",
                              "latitude":  31.18,
                              "longitude":  29.876
                          },
                          {
                              "id":  "EG0218",
                              "name":  "الساحل الشمالى",
                              "latitude":  30.935,
                              "longitude":  29.475
                          },
                          {
                              "id":  "EG0200",
                              "name":  "خارج الزمام",
                              "latitude":  30.537,
                              "longitude":  29.721
                          },
                          {
                              "id":  "EG0210",
                              "name":  "قسم الجمرك",
                              "latitude":  31.203,
                              "longitude":  29.879
                          },
                          {
                              "id":  "EG0212",
                              "name":  "قسم الدخيلة",
                              "latitude":  31.119,
                              "longitude":  29.806
                          },
                          {
                              "id":  "EG0213",
                              "name":  "قسم العامرية",
                              "latitude":  30.959,
                              "longitude":  29.828
                          },
                          {
                              "id":  "EG0206",
                              "name":  "قسم العطارين",
                              "latitude":  31.198,
                              "longitude":  29.904
                          },
                          {
                              "id":  "EG0209",
                              "name":  "قسم اللبان",
                              "latitude":  31.191,
                              "longitude":  29.892
                          },
                          {
                              "id":  "EG0201",
                              "name":  "قسم المنتزة",
                              "latitude":  31.264,
                              "longitude":  30.03
                          },
                          {
                              "id":  "EG0207",
                              "name":  "قسم المنشية",
                              "latitude":  31.198,
                              "longitude":  29.892
                          },
                          {
                              "id":  "EG0202",
                              "name":  "قسم أول الرمل",
                              "latitude":  31.237,
                              "longitude":  29.986
                          },
                          {
                              "id":  "EG0204",
                              "name":  "قسم باب شرقى",
                              "latitude":  31.205,
                              "longitude":  29.921
                          },
                          {
                              "id":  "EG0214",
                              "name":  "قسم برج العرب",
                              "latitude":  30.901,
                              "longitude":  29.494
                          },
                          {
                              "id":  "EG0217",
                              "name":  "قسم ثان الرمل",
                              "latitude":  31.211,
                              "longitude":  29.994
                          },
                          {
                              "id":  "EG0203",
                              "name":  "قسم سيدى جابر",
                              "latitude":  31.216,
                              "longitude":  29.949
                          },
                          {
                              "id":  "EG0208",
                              "name":  "قسم كرموز",
                              "latitude":  31.179,
                              "longitude":  29.904
                          },
                          {
                              "id":  "EG0205",
                              "name":  "قسم محرم بك",
                              "latitude":  31.184,
                              "longitude":  29.939
                          },
                          {
                              "id":  "EG0211",
                              "name":  "قسم مينا البصل",
                              "latitude":  31.167,
                              "longitude":  29.88
                          },
                          {
                              "id":  "EG0216",
                              "name":  "مدينه برج العرب الجديده",
                              "latitude":  30.899,
                              "longitude":  29.622
                          }
                      ]
    },
    {
        "id":  "EG03",
        "name":  "بورسعيد",
        "latitude":  31.067,
        "longitude":  32.43,
        "districts":  [
                          {
                              "id":  "EG0312",
                              "name":  "إدارة شرطة ميناء بورسعيد",
                              "latitude":  31.254,
                              "longitude":  32.301
                          },
                          {
                              "id":  "EG0306",
                              "name":  "قسم الجنوب",
                              "latitude":  31.141,
                              "longitude":  32.291
                          },
                          {
                              "id":  "EG0307",
                              "name":  "قسم الزهور",
                              "latitude":  31.266,
                              "longitude":  32.266
                          },
                          {
                              "id":  "EG0301",
                              "name":  "قسم الشرق",
                              "latitude":  31.263,
                              "longitude":  32.307
                          },
                          {
                              "id":  "EG0305",
                              "name":  "قسم الضواحى",
                              "latitude":  31.246,
                              "longitude":  32.28
                          },
                          {
                              "id":  "EG0302",
                              "name":  "قسم العرب",
                              "latitude":  31.262,
                              "longitude":  32.294
                          },
                          {
                              "id":  "EG0303",
                              "name":  "قسم المناخ",
                              "latitude":  31.265,
                              "longitude":  32.287
                          },
                          {
                              "id":  "EG0310",
                              "name":  "قسم المناصرة",
                              "latitude":  31.237,
                              "longitude":  32.173
                          },
                          {
                              "id":  "EG0304",
                              "name":  "قسم بور فؤاد",
                              "latitude":  31.236,
                              "longitude":  32.33
                          },
                          {
                              "id":  "EG0311",
                              "name":  "قسم ثان الجنوب",
                              "latitude":  30.993,
                              "longitude":  32.254
                          },
                          {
                              "id":  "EG0308",
                              "name":  "قسم ثان بور فؤاد",
                              "latitude":  31.17,
                              "longitude":  32.318
                          },
                          {
                              "id":  "EG0309",
                              "name":  "قسم مبارك - شرق التفريعة",
                              "latitude":  31.067,
                              "longitude":  32.43
                          }
                      ]
    },
    {
        "id":  "EG04",
        "name":  "السويس",
        "latitude":  29.622,
        "longitude":  32.121,
        "districts":  [
                          {
                              "id":  "EG0406",
                              "name":  "إدارة شرطة ميناء السويس",
                              "latitude":  29.882,
                              "longitude":  32.619
                          },
                          {
                              "id":  "EG0402",
                              "name":  "قسم الأربعين",
                              "latitude":  29.98,
                              "longitude":  32.536
                          },
                          {
                              "id":  "EG0405",
                              "name":  "قسم الجناين",
                              "latitude":  30.063,
                              "longitude":  32.703
                          },
                          {
                              "id":  "EG0401",
                              "name":  "قسم السويس",
                              "latitude":  29.961,
                              "longitude":  32.569
                          },
                          {
                              "id":  "EG0403",
                              "name":  "قسم عتاقة",
                              "latitude":  29.539,
                              "longitude":  32.128
                          },
                          {
                              "id":  "EG0404",
                              "name":  "قسم فيصل",
                              "latitude":  30.118,
                              "longitude":  32.181
                          }
                      ]
    },
    {
        "id":  "EG11",
        "name":  "دمياط",
        "latitude":  31.394,
        "longitude":  31.628,
        "districts":  [
                          {
                              "id":  "EG1108",
                              "name":  "إداره شرطه ميناء دمياط الجديد",
                              "latitude":  31.466,
                              "longitude":  31.778
                          },
                          {
                              "id":  "EG1101",
                              "name":  "قسم أول دمياط",
                              "latitude":  31.407,
                              "longitude":  31.807
                          },
                          {
                              "id":  "EG1109",
                              "name":  "قسم ثان دمياط",
                              "latitude":  31.425,
                              "longitude":  31.819
                          },
                          {
                              "id":  "EG1106",
                              "name":  "قسم رأس البر",
                              "latitude":  31.51,
                              "longitude":  31.83
                          },
                          {
                              "id":  "EG1105",
                              "name":  "قسم مدينه دمياط الجديده",
                              "latitude":  31.439,
                              "longitude":  31.706
                          },
                          {
                              "id":  "EG1107",
                              "name":  "مركز الزرقا",
                              "latitude":  31.209,
                              "longitude":  31.649
                          },
                          {
                              "id":  "EG1102",
                              "name":  "مركز دمياط",
                              "latitude":  31.44,
                              "longitude":  31.842
                          },
                          {
                              "id":  "EG1103",
                              "name":  "مركز فارسكور",
                              "latitude":  31.31,
                              "longitude":  31.733
                          },
                          {
                              "id":  "EG1104",
                              "name":  "مركز كفر سعد",
                              "latitude":  31.359,
                              "longitude":  31.603
                          }
                      ]
    },
    {
        "id":  "EG12",
        "name":  "الدقهلية",
        "latitude":  30.966,
        "longitude":  31.469,
        "districts":  [
                          {
                              "id":  "EG1201",
                              "name":  "قسم اول المنصورة",
                              "latitude":  31.029,
                              "longitude":  31.375
                          },
                          {
                              "id":  "EG1202",
                              "name":  "قسم ثان المنصورة",
                              "latitude":  31.047,
                              "longitude":  31.419
                          },
                          {
                              "id":  "EG1220",
                              "name":  "قسم جمصة",
                              "latitude":  31.438,
                              "longitude":  31.549
                          },
                          {
                              "id":  "EG1212",
                              "name":  "قسم ميت غمر",
                              "latitude":  30.713,
                              "longitude":  31.276
                          },
                          {
                              "id":  "EG1204",
                              "name":  "مركز أجا",
                              "latitude":  30.895,
                              "longitude":  31.313
                          },
                          {
                              "id":  "EG1215",
                              "name":  "مركز الجمالية",
                              "latitude":  31.205,
                              "longitude":  31.852
                          },
                          {
                              "id":  "EG1205",
                              "name":  "مركز السنبلاوين",
                              "latitude":  30.883,
                              "longitude":  31.513
                          },
                          {
                              "id":  "EG1206",
                              "name":  "مركز المطرية",
                              "latitude":  31.191,
                              "longitude":  32.004
                          },
                          {
                              "id":  "EG1207",
                              "name":  "مركز المنزلة",
                              "latitude":  31.153,
                              "longitude":  31.958
                          },
                          {
                              "id":  "EG1203",
                              "name":  "مركز المنصورة",
                              "latitude":  31.053,
                              "longitude":  31.467
                          },
                          {
                              "id":  "EG1208",
                              "name":  "مركز بلقاس",
                              "latitude":  31.344,
                              "longitude":  31.379
                          },
                          {
                              "id":  "EG1218",
                              "name":  "مركز بنى عبيد",
                              "latitude":  31.024,
                              "longitude":  31.648
                          },
                          {
                              "id":  "EG1216",
                              "name":  "مركز تمى الأمديد",
                              "latitude":  30.947,
                              "longitude":  31.594
                          },
                          {
                              "id":  "EG1209",
                              "name":  "مركز دكرنس",
                              "latitude":  31.093,
                              "longitude":  31.78
                          },
                          {
                              "id":  "EG1210",
                              "name":  "مركز شربين",
                              "latitude":  31.261,
                              "longitude":  31.576
                          },
                          {
                              "id":  "EG1211",
                              "name":  "مركز طلخا",
                              "latitude":  31.109,
                              "longitude":  31.383
                          },
                          {
                              "id":  "EG1219",
                              "name":  "مركز محلة دمنة",
                              "latitude":  31.09,
                              "longitude":  31.513
                          },
                          {
                              "id":  "EG1214",
                              "name":  "مركز منية النصر",
                              "latitude":  31.154,
                              "longitude":  31.707
                          },
                          {
                              "id":  "EG1217",
                              "name":  "مركز ميت سلسيل",
                              "latitude":  31.233,
                              "longitude":  31.792
                          },
                          {
                              "id":  "EG1213",
                              "name":  "مركز ميت غمر",
                              "latitude":  30.708,
                              "longitude":  31.338
                          },
                          {
                              "id":  "EG1221",
                              "name":  "مركز نبروة",
                              "latitude":  31.129,
                              "longitude":  31.297
                          }
                      ]
    },
    {
        "id":  "EG13",
        "name":  "الشرقية",
        "latitude":  30.65,
        "longitude":  31.772,
        "districts":  [
                          {
                              "id":  "EG1300",
                              "name":  "خارج الزمام",
                              "latitude":  30.327,
                              "longitude":  31.719
                          },
                          {
                              "id":  "EG1307",
                              "name":  "قسم الصالحية الجديدة",
                              "latitude":  30.634,
                              "longitude":  32.006
                          },
                          {
                              "id":  "EG1320",
                              "name":  "قسم القرين",
                              "latitude":  30.611,
                              "longitude":  31.742
                          },
                          {
                              "id":  "EG1318",
                              "name":  "قسم القنايات",
                              "latitude":  30.635,
                              "longitude":  31.471
                          },
                          {
                              "id":  "EG1301",
                              "name":  "قسم اول الزقازيق",
                              "latitude":  30.585,
                              "longitude":  31.513
                          },
                          {
                              "id":  "EG1309",
                              "name":  "قسم اول مدينة العاشر من رمضان",
                              "latitude":  30.222,
                              "longitude":  31.732
                          },
                          {
                              "id":  "EG1302",
                              "name":  "قسم ثان الزقازيق",
                              "latitude":  30.601,
                              "longitude":  31.519
                          },
                          {
                              "id":  "EG1321",
                              "name":  "قسم ثان مدينه العاشر من رمضان",
                              "latitude":  30.238,
                              "longitude":  31.7
                          },
                          {
                              "id":  "EG1311",
                              "name":  "قسم فاقوس",
                              "latitude":  30.723,
                              "longitude":  31.798
                          },
                          {
                              "id":  "EG1304",
                              "name":  "مركز أبو حماد",
                              "latitude":  30.543,
                              "longitude":  31.649
                          },
                          {
                              "id":  "EG1305",
                              "name":  "مركز أبوكبير",
                              "latitude":  30.733,
                              "longitude":  31.69
                          },
                          {
                              "id":  "EG1317",
                              "name":  "مركز الأبراهيمية",
                              "latitude":  30.732,
                              "longitude":  31.564
                          },
                          {
                              "id":  "EG1306",
                              "name":  "مركز الحسينية",
                              "latitude":  30.924,
                              "longitude":  32.006
                          },
                          {
                              "id":  "EG1303",
                              "name":  "مركز الزقازيق",
                              "latitude":  30.587,
                              "longitude":  31.581
                          },
                          {
                              "id":  "EG1319",
                              "name":  "مركز أولاد صقر",
                              "latitude":  30.969,
                              "longitude":  31.777
                          },
                          {
                              "id":  "EG1308",
                              "name":  "مركز بلبيس",
                              "latitude":  30.408,
                              "longitude":  31.531
                          },
                          {
                              "id":  "EG1310",
                              "name":  "مركز ديرب نجم",
                              "latitude":  30.752,
                              "longitude":  31.444
                          },
                          {
                              "id":  "EG1312",
                              "name":  "مركز فاقوس",
                              "latitude":  30.749,
                              "longitude":  31.896
                          },
                          {
                              "id":  "EG1313",
                              "name":  "مركز كفر صقر",
                              "latitude":  30.837,
                              "longitude":  31.675
                          },
                          {
                              "id":  "EG1316",
                              "name":  "مركز مشتول السوق",
                              "latitude":  30.361,
                              "longitude":  31.383
                          },
                          {
                              "id":  "EG1314",
                              "name":  "مركز منيا القمح",
                              "latitude":  30.507,
                              "longitude":  31.369
                          },
                          {
                              "id":  "EG1315",
                              "name":  "مركز ههيا",
                              "latitude":  30.652,
                              "longitude":  31.617
                          }
                      ]
    },
    {
        "id":  "EG14",
        "name":  "القليوبية",
        "latitude":  30.36,
        "longitude":  31.209,
        "districts":  [
                          {
                              "id":  "EG1400",
                              "name":  "خارج الزمام",
                              "latitude":  30.24,
                              "longitude":  31.514
                          },
                          {
                              "id":  "EG1412",
                              "name":  "قسم الخصوص",
                              "latitude":  30.157,
                              "longitude":  31.318
                          },
                          {
                              "id":  "EG1413",
                              "name":  "قسم العبور",
                              "latitude":  30.225,
                              "longitude":  31.447
                          },
                          {
                              "id":  "EG1406",
                              "name":  "قسم أول شبرا الخيمة",
                              "latitude":  30.132,
                              "longitude":  31.248
                          },
                          {
                              "id":  "EG1401",
                              "name":  "قسم بنها",
                              "latitude":  30.466,
                              "longitude":  31.19
                          },
                          {
                              "id":  "EG1407",
                              "name":  "قسم ثان شبرا الخيمة",
                              "latitude":  30.135,
                              "longitude":  31.285
                          },
                          {
                              "id":  "EG1409",
                              "name":  "قسم قليوب",
                              "latitude":  30.18,
                              "longitude":  31.216
                          },
                          {
                              "id":  "EG1414",
                              "name":  "قسم قها",
                              "latitude":  30.293,
                              "longitude":  31.215
                          },
                          {
                              "id":  "EG1403",
                              "name":  "مركز الخانكة",
                              "latitude":  30.231,
                              "longitude":  31.358
                          },
                          {
                              "id":  "EG1404",
                              "name":  "مركز القناطر الخيرية",
                              "latitude":  30.214,
                              "longitude":  31.135
                          },
                          {
                              "id":  "EG1402",
                              "name":  "مركز بنها",
                              "latitude":  30.443,
                              "longitude":  31.248
                          },
                          {
                              "id":  "EG1405",
                              "name":  "مركز شبين القناطر",
                              "latitude":  30.296,
                              "longitude":  31.307
                          },
                          {
                              "id":  "EG1408",
                              "name":  "مركز طوخ",
                              "latitude":  30.344,
                              "longitude":  31.19
                          },
                          {
                              "id":  "EG1410",
                              "name":  "مركز قليوب",
                              "latitude":  30.207,
                              "longitude":  31.214
                          },
                          {
                              "id":  "EG1411",
                              "name":  "مركز كفر شكر",
                              "latitude":  30.554,
                              "longitude":  31.275
                          }
                      ]
    },
    {
        "id":  "EG15",
        "name":  "كفر الشيخ",
        "latitude":  31.31,
        "longitude":  30.901,
        "districts":  [
                          {
                              "id":  "EG1505",
                              "name":  "قسم دسوق",
                              "latitude":  31.145,
                              "longitude":  30.649
                          },
                          {
                              "id":  "EG1501",
                              "name":  "قسم كفر الشيخ",
                              "latitude":  31.119,
                              "longitude":  30.941
                          },
                          {
                              "id":  "EG1503",
                              "name":  "مركز البرلس",
                              "latitude":  31.521,
                              "longitude":  31.273
                          },
                          {
                              "id":  "EG1511",
                              "name":  "مركز الحامول",
                              "latitude":  31.388,
                              "longitude":  31.075
                          },
                          {
                              "id":  "EG1512",
                              "name":  "مركز الرياض",
                              "latitude":  31.321,
                              "longitude":  30.92
                          },
                          {
                              "id":  "EG1504",
                              "name":  "مركز بيلا",
                              "latitude":  31.32,
                              "longitude":  31.248
                          },
                          {
                              "id":  "EG1506",
                              "name":  "مركز دسوق",
                              "latitude":  31.15,
                              "longitude":  30.72
                          },
                          {
                              "id":  "EG1507",
                              "name":  "مركز سيدى سالم",
                              "latitude":  31.31,
                              "longitude":  30.738
                          },
                          {
                              "id":  "EG1508",
                              "name":  "مركز فوه",
                              "latitude":  31.232,
                              "longitude":  30.564
                          },
                          {
                              "id":  "EG1509",
                              "name":  "مركز قلين",
                              "latitude":  31.085,
                              "longitude":  30.817
                          },
                          {
                              "id":  "EG1502",
                              "name":  "مركز كفر الشيخ",
                              "latitude":  31.2,
                              "longitude":  31.016
                          },
                          {
                              "id":  "EG1510",
                              "name":  "مركز مطوبس",
                              "latitude":  31.383,
                              "longitude":  30.47
                          }
                      ]
    },
    {
        "id":  "EG16",
        "name":  "الغربية",
        "latitude":  30.872,
        "longitude":  31.017,
        "districts":  [
                          {
                              "id":  "EG1605",
                              "name":  "قسم أول المحلة الكبرى",
                              "latitude":  30.972,
                              "longitude":  31.172
                          },
                          {
                              "id":  "EG1601",
                              "name":  "قسم أول طنطا",
                              "latitude":  30.795,
                              "longitude":  31.014
                          },
                          {
                              "id":  "EG1606",
                              "name":  "قسم ثان المحلة الكبرى",
                              "latitude":  30.971,
                              "longitude":  31.157
                          },
                          {
                              "id":  "EG1602",
                              "name":  "قسم ثان طنطا",
                              "latitude":  30.786,
                              "longitude":  30.989
                          },
                          {
                              "id":  "EG1604",
                              "name":  "مركز السنطة",
                              "latitude":  30.773,
                              "longitude":  31.119
                          },
                          {
                              "id":  "EG1607",
                              "name":  "مركز المحله الكبرى",
                              "latitude":  31.017,
                              "longitude":  31.13
                          },
                          {
                              "id":  "EG1608",
                              "name":  "مركز بسيون",
                              "latitude":  30.959,
                              "longitude":  30.827
                          },
                          {
                              "id":  "EG1609",
                              "name":  "مركز زفتى",
                              "latitude":  30.728,
                              "longitude":  31.215
                          },
                          {
                              "id":  "EG1610",
                              "name":  "مركز سمنود",
                              "latitude":  30.95,
                              "longitude":  31.221
                          },
                          {
                              "id":  "EG1603",
                              "name":  "مركز طنطا",
                              "latitude":  30.809,
                              "longitude":  30.932
                          },
                          {
                              "id":  "EG1611",
                              "name":  "مركز قطور",
                              "latitude":  30.971,
                              "longitude":  30.97
                          },
                          {
                              "id":  "EG1612",
                              "name":  "مركز كفر الزيات",
                              "latitude":  30.807,
                              "longitude":  30.835
                          }
                      ]
    },
    {
        "id":  "EG17",
        "name":  "المنوفية",
        "latitude":  30.358,
        "longitude":  30.661,
        "districts":  [
                          {
                              "id":  "EG1701",
                              "name":  "قسم شبين الكوم",
                              "latitude":  30.556,
                              "longitude":  31
                          },
                          {
                              "id":  "EG1710",
                              "name":  "قسم مدينة سرس الليانة",
                              "latitude":  30.445,
                              "longitude":  30.969
                          },
                          {
                              "id":  "EG1712",
                              "name":  "قسم مدينة منوف",
                              "latitude":  30.462,
                              "longitude":  30.931
                          },
                          {
                              "id":  "EG1703",
                              "name":  "مركز أشمون",
                              "latitude":  30.299,
                              "longitude":  31.008
                          },
                          {
                              "id":  "EG1704",
                              "name":  "مركز الباجور",
                              "latitude":  30.413,
                              "longitude":  31.032
                          },
                          {
                              "id":  "EG1711",
                              "name":  "مركز السادات",
                              "latitude":  30.358,
                              "longitude":  30.661
                          },
                          {
                              "id":  "EG1705",
                              "name":  "مركز الشهداء",
                              "latitude":  30.601,
                              "longitude":  30.87
                          },
                          {
                              "id":  "EG1706",
                              "name":  "مركز بركة السبع",
                              "latitude":  30.651,
                              "longitude":  31.108
                          },
                          {
                              "id":  "EG1707",
                              "name":  "مركز تلا",
                              "latitude":  30.67,
                              "longitude":  30.946
                          },
                          {
                              "id":  "EG1702",
                              "name":  "مركز شبين الكوم",
                              "latitude":  30.561,
                              "longitude":  30.954
                          },
                          {
                              "id":  "EG1708",
                              "name":  "مركز قويسنا",
                              "latitude":  30.56,
                              "longitude":  31.163
                          },
                          {
                              "id":  "EG1709",
                              "name":  "مركز منوف",
                              "latitude":  30.46,
                              "longitude":  30.881
                          }
                      ]
    },
    {
        "id":  "EG18",
        "name":  "البحيرة",
        "latitude":  30.689,
        "longitude":  30.356,
        "districts":  [
                          {
                              "id":  "EG1800",
                              "name":  "خارج الزمام",
                              "latitude":  30.26,
                              "longitude":  30.306
                          },
                          {
                              "id":  "EG1801",
                              "name":  "قسم دمنهور",
                              "latitude":  31.049,
                              "longitude":  30.463
                          },
                          {
                              "id":  "EG1817",
                              "name":  "قسم غرب النوبارية",
                              "latitude":  30.425,
                              "longitude":  29.897
                          },
                          {
                              "id":  "EG1811",
                              "name":  "قسم كفرالدوار",
                              "latitude":  31.137,
                              "longitude":  30.133
                          },
                          {
                              "id":  "EG1803",
                              "name":  "مركز ابوالمطامير",
                              "latitude":  30.773,
                              "longitude":  30.144
                          },
                          {
                              "id":  "EG1804",
                              "name":  "مركز ابوحمص",
                              "latitude":  31.106,
                              "longitude":  30.31
                          },
                          {
                              "id":  "EG1816",
                              "name":  "مركز إدكو",
                              "latitude":  31.298,
                              "longitude":  30.325
                          },
                          {
                              "id":  "EG1805",
                              "name":  "مركز الدلنجات",
                              "latitude":  30.81,
                              "longitude":  30.49
                          },
                          {
                              "id":  "EG1815",
                              "name":  "مركز الرحمانية",
                              "latitude":  31.106,
                              "longitude":  30.584
                          },
                          {
                              "id":  "EG1806",
                              "name":  "مركز المحمودية",
                              "latitude":  31.197,
                              "longitude":  30.488
                          },
                          {
                              "id":  "EG1807",
                              "name":  "مركز إيتاى البارود",
                              "latitude":  30.886,
                              "longitude":  30.656
                          },
                          {
                              "id":  "EG1818",
                              "name":  "مركز بدر",
                              "latitude":  30.547,
                              "longitude":  30.679
                          },
                          {
                              "id":  "EG1808",
                              "name":  "مركز حوش عيسى",
                              "latitude":  30.891,
                              "longitude":  30.346
                          },
                          {
                              "id":  "EG1802",
                              "name":  "مركز دمنهور",
                              "latitude":  31.032,
                              "longitude":  30.527
                          },
                          {
                              "id":  "EG1809",
                              "name":  "مركز رشيد",
                              "latitude":  31.379,
                              "longitude":  30.375
                          },
                          {
                              "id":  "EG1810",
                              "name":  "مركز شبراخيت",
                              "latitude":  31.003,
                              "longitude":  30.679
                          },
                          {
                              "id":  "EG1812",
                              "name":  "مركز كفر الدوار",
                              "latitude":  31.129,
                              "longitude":  30.038
                          },
                          {
                              "id":  "EG1813",
                              "name":  "مركز كوم حمادة",
                              "latitude":  30.654,
                              "longitude":  30.774
                          },
                          {
                              "id":  "EG1814",
                              "name":  "مركز وادى النطرون",
                              "latitude":  30.43,
                              "longitude":  30.313
                          }
                      ]
    },
    {
        "id":  "EG19",
        "name":  "الإسماعيلية",
        "latitude":  30.603,
        "longitude":  32.55,
        "districts":  [
                          {
                              "id":  "EG1908",
                              "name":  "قسم القنطرة شرق",
                              "latitude":  30.603,
                              "longitude":  32.55
                          },
                          {
                              "id":  "EG1901",
                              "name":  "قسم أول الاسماعيلية",
                              "latitude":  30.606,
                              "longitude":  32.311
                          },
                          {
                              "id":  "EG1903",
                              "name":  "قسم ثالث الاسماعيلية",
                              "latitude":  30.612,
                              "longitude":  32.291
                          },
                          {
                              "id":  "EG1902",
                              "name":  "قسم ثان الاسماعيلية",
                              "latitude":  30.614,
                              "longitude":  32.26
                          },
                          {
                              "id":  "EG1904",
                              "name":  "مركز الاسماعيلية",
                              "latitude":  30.426,
                              "longitude":  32.183
                          },
                          {
                              "id":  "EG1905",
                              "name":  "مركز التل الكبير",
                              "latitude":  30.418,
                              "longitude":  31.933
                          },
                          {
                              "id":  "EG1906",
                              "name":  "مركز القنطرة",
                              "latitude":  30.742,
                              "longitude":  32.245
                          },
                          {
                              "id":  "EG1907",
                              "name":  "مركز فايد",
                              "latitude":  30.366,
                              "longitude":  32.292
                          }
                      ]
    },
    {
        "id":  "EG21",
        "name":  "الجيزة",
        "latitude":  28.935,
        "longitude":  29.392,
        "districts":  [
                          {
                              "id":  "EG2100",
                              "name":  "خارج الزمام",
                              "latitude":  28.935,
                              "longitude":  29.392
                          },
                          {
                              "id":  "EG2106",
                              "name":  "قسم الأهرام",
                              "latitude":  29.99,
                              "longitude":  31.136
                          },
                          {
                              "id":  "EG2104",
                              "name":  "قسم الجيزة",
                              "latitude":  29.999,
                              "longitude":  31.216
                          },
                          {
                              "id":  "EG2108",
                              "name":  "قسم الحوامدية",
                              "latitude":  29.902,
                              "longitude":  31.253
                          },
                          {
                              "id":  "EG2103",
                              "name":  "قسم الدقي",
                              "latitude":  30.042,
                              "longitude":  31.208
                          },
                          {
                              "id":  "EG2119",
                              "name":  "قسم الشيخ زايد",
                              "latitude":  30.049,
                              "longitude":  30.978
                          },
                          {
                              "id":  "EG2102",
                              "name":  "قسم العجوزة",
                              "latitude":  30.059,
                              "longitude":  31.204
                          },
                          {
                              "id":  "EG2118",
                              "name":  "قسم العمرانية",
                              "latitude":  29.993,
                              "longitude":  31.177
                          },
                          {
                              "id":  "EG2114",
                              "name":  "قسم الواحاتالبحرية",
                              "latitude":  28.452,
                              "longitude":  28.836
                          },
                          {
                              "id":  "EG2117",
                              "name":  "قسم الوراق",
                              "latitude":  30.097,
                              "longitude":  31.189
                          },
                          {
                              "id":  "EG2101",
                              "name":  "قسم امبابه",
                              "latitude":  30.083,
                              "longitude":  31.21
                          },
                          {
                              "id":  "EG2107",
                              "name":  "قسم أول 6 أكتوبر",
                              "latitude":  29.985,
                              "longitude":  30.963
                          },
                          {
                              "id":  "EG2105",
                              "name":  "قسم بولاق الدكرور",
                              "latitude":  30.03,
                              "longitude":  31.19
                          },
                          {
                              "id":  "EG2121",
                              "name":  "قسم ثان 6 أكتوبر",
                              "latitude":  29.941,
                              "longitude":  30.908
                          },
                          {
                              "id":  "EG2115",
                              "name":  "مركز أطفيح",
                              "latitude":  29.343,
                              "longitude":  31.25
                          },
                          {
                              "id":  "EG2110",
                              "name":  "مركز البدرشين",
                              "latitude":  29.824,
                              "longitude":  31.258
                          },
                          {
                              "id":  "EG2109",
                              "name":  "مركز الجيزة",
                              "latitude":  29.943,
                              "longitude":  31.213
                          },
                          {
                              "id":  "EG2111",
                              "name":  "مركز الصف",
                              "latitude":  29.62,
                              "longitude":  31.305
                          },
                          {
                              "id":  "EG2112",
                              "name":  "مركز العياط",
                              "latitude":  29.564,
                              "longitude":  31.25
                          },
                          {
                              "id":  "EG2113",
                              "name":  "مركز إمبابة",
                              "latitude":  30.22,
                              "longitude":  30.963
                          },
                          {
                              "id":  "EG2116",
                              "name":  "مركز أوسيم",
                              "latitude":  30.132,
                              "longitude":  31.142
                          },
                          {
                              "id":  "EG2120",
                              "name":  "مركز كرداسة",
                              "latitude":  30.051,
                              "longitude":  31.134
                          }
                      ]
    },
    {
        "id":  "EG22",
        "name":  "بني سويف",
        "latitude":  28.725,
        "longitude":  31.338,
        "districts":  [
                          {
                              "id":  "EG2200",
                              "name":  "خارج الزمام",
                              "latitude":  28.723,
                              "longitude":  31.341
                          },
                          {
                              "id":  "EG2201",
                              "name":  "قسم بنى سويف",
                              "latitude":  29.077,
                              "longitude":  31.097
                          },
                          {
                              "id":  "EG2203",
                              "name":  "قسم مدينة بنى سويف الجديدة",
                              "latitude":  28.982,
                              "longitude":  31.159
                          },
                          {
                              "id":  "EG2204",
                              "name":  "مركز الفشن",
                              "latitude":  28.809,
                              "longitude":  30.827
                          },
                          {
                              "id":  "EG2205",
                              "name":  "مركز الواسطى",
                              "latitude":  29.324,
                              "longitude":  31.17
                          },
                          {
                              "id":  "EG2206",
                              "name":  "مركز أهناسيا",
                              "latitude":  29.102,
                              "longitude":  30.943
                          },
                          {
                              "id":  "EG2207",
                              "name":  "مركز ببا",
                              "latitude":  28.951,
                              "longitude":  30.967
                          },
                          {
                              "id":  "EG2202",
                              "name":  "مركز بنى سويف",
                              "latitude":  29.098,
                              "longitude":  31.042
                          },
                          {
                              "id":  "EG2208",
                              "name":  "مركز سمسطا",
                              "latitude":  28.951,
                              "longitude":  30.866
                          },
                          {
                              "id":  "EG2209",
                              "name":  "مركز ناصر",
                              "latitude":  29.187,
                              "longitude":  31.078
                          }
                      ]
    },
    {
        "id":  "EG23",
        "name":  "الفيوم",
        "latitude":  29.318,
        "longitude":  30.585,
        "districts":  [
                          {
                              "id":  "EG2300",
                              "name":  "خارج الزمام",
                              "latitude":  29.347,
                              "longitude":  30.344
                          },
                          {
                              "id":  "EG2301",
                              "name":  "قسم الفيوم",
                              "latitude":  29.314,
                              "longitude":  30.839
                          },
                          {
                              "id":  "EG2308",
                              "name":  "مدينة الفيوم الجديدة",
                              "latitude":  29.208,
                              "longitude":  30.882
                          },
                          {
                              "id":  "EG2303",
                              "name":  "مركز أبشواى",
                              "latitude":  29.374,
                              "longitude":  30.69
                          },
                          {
                              "id":  "EG2304",
                              "name":  "مركز أطسا",
                              "latitude":  29.208,
                              "longitude":  30.767
                          },
                          {
                              "id":  "EG2302",
                              "name":  "مركز الفيوم",
                              "latitude":  29.3,
                              "longitude":  30.955
                          },
                          {
                              "id":  "EG2305",
                              "name":  "مركز سنورس",
                              "latitude":  29.441,
                              "longitude":  30.815
                          },
                          {
                              "id":  "EG2306",
                              "name":  "مركز طامية",
                              "latitude":  29.467,
                              "longitude":  30.982
                          },
                          {
                              "id":  "EG2307",
                              "name":  "مركز يوسف الصديق",
                              "latitude":  29.353,
                              "longitude":  30.586
                          }
                      ]
    },
    {
        "id":  "EG24",
        "name":  "المنيا",
        "latitude":  28.156,
        "longitude":  31.61,
        "districts":  [
                          {
                              "id":  "EG2400",
                              "name":  "خارج الزمام",
                              "latitude":  28.16,
                              "longitude":  31.623
                          },
                          {
                              "id":  "EG2401",
                              "name":  "قسم المنيا",
                              "latitude":  28.095,
                              "longitude":  30.744
                          },
                          {
                              "id":  "EG2411",
                              "name":  "قسم ملوى",
                              "latitude":  27.729,
                              "longitude":  30.837
                          },
                          {
                              "id":  "EG2403",
                              "name":  "مدينة المنيا الجديدة",
                              "latitude":  28.11,
                              "longitude":  30.788
                          },
                          {
                              "id":  "EG2404",
                              "name":  "مركز ابو قرقاص",
                              "latitude":  27.939,
                              "longitude":  30.77
                          },
                          {
                              "id":  "EG2405",
                              "name":  "مركز العدوة",
                              "latitude":  28.696,
                              "longitude":  30.74
                          },
                          {
                              "id":  "EG2402",
                              "name":  "مركز المنيا",
                              "latitude":  28.101,
                              "longitude":  30.641
                          },
                          {
                              "id":  "EG2406",
                              "name":  "مركز بنى مزار",
                              "latitude":  28.518,
                              "longitude":  30.731
                          },
                          {
                              "id":  "EG2407",
                              "name":  "مركز دير مواس",
                              "latitude":  27.655,
                              "longitude":  30.79
                          },
                          {
                              "id":  "EG2408",
                              "name":  "مركز سمالوط",
                              "latitude":  28.285,
                              "longitude":  30.629
                          },
                          {
                              "id":  "EG2409",
                              "name":  "مركز مطاى",
                              "latitude":  28.431,
                              "longitude":  30.71
                          },
                          {
                              "id":  "EG2410",
                              "name":  "مركز مغاغة",
                              "latitude":  28.641,
                              "longitude":  30.794
                          },
                          {
                              "id":  "EG2412",
                              "name":  "مركز ملوى",
                              "latitude":  27.775,
                              "longitude":  30.801
                          }
                      ]
    },
    {
        "id":  "EG25",
        "name":  "أسيوط",
        "latitude":  27.359,
        "longitude":  31.795,
        "districts":  [
                          {
                              "id":  "EG2500",
                              "name":  "صحراء أسيوط",
                              "latitude":  27.358,
                              "longitude":  31.799
                          },
                          {
                              "id":  "EG2501",
                              "name":  "قسم أول أسيوط",
                              "latitude":  27.186,
                              "longitude":  31.154
                          },
                          {
                              "id":  "EG2502",
                              "name":  "قسم ثان أسيوط",
                              "latitude":  27.193,
                              "longitude":  31.179
                          },
                          {
                              "id":  "EG2514",
                              "name":  "مدينة اسيوط الجديدة",
                              "latitude":  27.254,
                              "longitude":  31.281
                          },
                          {
                              "id":  "EG2504",
                              "name":  "مركز أبنوب",
                              "latitude":  27.295,
                              "longitude":  31.106
                          },
                          {
                              "id":  "EG2505",
                              "name":  "مركز أبوتيج",
                              "latitude":  27.037,
                              "longitude":  31.289
                          },
                          {
                              "id":  "EG2503",
                              "name":  "مركز أسيوط",
                              "latitude":  27.117,
                              "longitude":  31.232
                          },
                          {
                              "id":  "EG2506",
                              "name":  "مركز البدارى",
                              "latitude":  26.946,
                              "longitude":  31.456
                          },
                          {
                              "id":  "EG2508",
                              "name":  "مركز الغنايم",
                              "latitude":  26.922,
                              "longitude":  31.329
                          },
                          {
                              "id":  "EG2513",
                              "name":  "مركز الفتح",
                              "latitude":  27.218,
                              "longitude":  31.212
                          },
                          {
                              "id":  "EG2509",
                              "name":  "مركز القوصية",
                              "latitude":  27.403,
                              "longitude":  30.826
                          },
                          {
                              "id":  "EG2510",
                              "name":  "مركز ديروط",
                              "latitude":  27.537,
                              "longitude":  30.782
                          },
                          {
                              "id":  "EG2507",
                              "name":  "مركز ساحل سليم",
                              "latitude":  27.093,
                              "longitude":  31.349
                          },
                          {
                              "id":  "EG2511",
                              "name":  "مركز صدفا",
                              "latitude":  26.943,
                              "longitude":  31.38
                          },
                          {
                              "id":  "EG2512",
                              "name":  "مركز منفلوط",
                              "latitude":  27.294,
                              "longitude":  30.951
                          }
                      ]
    },
    {
        "id":  "EG26",
        "name":  "سوهاج",
        "latitude":  26.726,
        "longitude":  32.175,
        "districts":  [
                          {
                              "id":  "EG2600",
                              "name":  "صحراء سوهاج",
                              "latitude":  26.727,
                              "longitude":  32.193
                          },
                          {
                              "id":  "EG2616",
                              "name":  "قسم الكوثر",
                              "latitude":  26.555,
                              "longitude":  31.722
                          },
                          {
                              "id":  "EG2601",
                              "name":  "قسم اول سوهاج",
                              "latitude":  26.547,
                              "longitude":  31.693
                          },
                          {
                              "id":  "EG2602",
                              "name":  "قسم ثان سوهاج",
                              "latitude":  26.543,
                              "longitude":  31.703
                          },
                          {
                              "id":  "EG2609",
                              "name":  "قسم جرجا",
                              "latitude":  26.348,
                              "longitude":  31.888
                          },
                          {
                              "id":  "EG2615",
                              "name":  "قسم طهطا",
                              "latitude":  26.767,
                              "longitude":  31.492
                          },
                          {
                              "id":  "EG2618",
                              "name":  "مدينة أخميم الجديدة",
                              "latitude":  26.524,
                              "longitude":  31.865
                          },
                          {
                              "id":  "EG2619",
                              "name":  "مدينة سوهاج الجديدة",
                              "latitude":  26.485,
                              "longitude":  31.649
                          },
                          {
                              "id":  "EG2604",
                              "name":  "مركز أخميم",
                              "latitude":  26.551,
                              "longitude":  31.715
                          },
                          {
                              "id":  "EG2605",
                              "name":  "مركز البلينا",
                              "latitude":  26.241,
                              "longitude":  31.944
                          },
                          {
                              "id":  "EG2617",
                              "name":  "مركز العسيرات",
                              "latitude":  26.401,
                              "longitude":  31.815
                          },
                          {
                              "id":  "EG2606",
                              "name":  "مركز المراغة",
                              "latitude":  26.669,
                              "longitude":  31.588
                          },
                          {
                              "id":  "EG2607",
                              "name":  "مركز المنشأة",
                              "latitude":  26.464,
                              "longitude":  31.756
                          },
                          {
                              "id":  "EG2610",
                              "name":  "مركز جرجا",
                              "latitude":  26.307,
                              "longitude":  31.867
                          },
                          {
                              "id":  "EG2611",
                              "name":  "مركز جهينة الغربية",
                              "latitude":  26.689,
                              "longitude":  31.471
                          },
                          {
                              "id":  "EG2608",
                              "name":  "مركز دار السلام",
                              "latitude":  26.274,
                              "longitude":  32.043
                          },
                          {
                              "id":  "EG2612",
                              "name":  "مركز ساقلته",
                              "latitude":  26.692,
                              "longitude":  31.663
                          },
                          {
                              "id":  "EG2603",
                              "name":  "مركز سوهاج",
                              "latitude":  26.547,
                              "longitude":  31.655
                          },
                          {
                              "id":  "EG2613",
                              "name":  "مركز طما",
                              "latitude":  26.874,
                              "longitude":  31.422
                          },
                          {
                              "id":  "EG2614",
                              "name":  "مركز طهطا",
                              "latitude":  26.785,
                              "longitude":  31.42
                          }
                      ]
    },
    {
        "id":  "EG27",
        "name":  "قنا",
        "latitude":  25.963,
        "longitude":  33.154,
        "districts":  [
                          {
                              "id":  "EG2700",
                              "name":  "صحراء قنا",
                              "latitude":  25.966,
                              "longitude":  33.191
                          },
                          {
                              "id":  "EG2701",
                              "name":  "قسم قنا",
                              "latitude":  26.165,
                              "longitude":  32.712
                          },
                          {
                              "id":  "EG2713",
                              "name":  "مدينة قنا الجديدة",
                              "latitude":  26.173,
                              "longitude":  32.761
                          },
                          {
                              "id":  "EG2703",
                              "name":  "مركز أبو طشت",
                              "latitude":  26.13,
                              "longitude":  32.086
                          },
                          {
                              "id":  "EG2704",
                              "name":  "مركز أرمنت",
                              "latitude":  25.612,
                              "longitude":  32.492
                          },
                          {
                              "id":  "EG2705",
                              "name":  "مركز إسنا",
                              "latitude":  25.365,
                              "longitude":  32.52
                          },
                          {
                              "id":  "EG2712",
                              "name":  "مركز الوقف",
                              "latitude":  26.084,
                              "longitude":  32.448
                          },
                          {
                              "id":  "EG2706",
                              "name":  "مركز دشنا",
                              "latitude":  26.142,
                              "longitude":  32.444
                          },
                          {
                              "id":  "EG2710",
                              "name":  "مركز فرشوط",
                              "latitude":  26.056,
                              "longitude":  32.149
                          },
                          {
                              "id":  "EG2711",
                              "name":  "مركز قفط",
                              "latitude":  25.998,
                              "longitude":  32.827
                          },
                          {
                              "id":  "EG2702",
                              "name":  "مركز قنا",
                              "latitude":  26.163,
                              "longitude":  32.578
                          },
                          {
                              "id":  "EG2707",
                              "name":  "مركز قوص",
                              "latitude":  25.857,
                              "longitude":  32.789
                          },
                          {
                              "id":  "EG2708",
                              "name":  "مركز نجع حمادى",
                              "latitude":  26.085,
                              "longitude":  32.297
                          },
                          {
                              "id":  "EG2709",
                              "name":  "مركز نقادة",
                              "latitude":  25.89,
                              "longitude":  32.711
                          }
                      ]
    },
    {
        "id":  "EG28",
        "name":  "أسوان",
        "latitude":  23.606,
        "longitude":  32.264,
        "districts":  [
                          {
                              "id":  "EG2800",
                              "name":  "خارج الزمام",
                              "latitude":  23.594,
                              "longitude":  32.263
                          },
                          {
                              "id":  "EG2801",
                              "name":  "قسم أسوان",
                              "latitude":  24.063,
                              "longitude":  32.901
                          },
                          {
                              "id":  "EG2808",
                              "name":  "مدينة أسوان الجديدة",
                              "latitude":  24.068,
                              "longitude":  32.983
                          },
                          {
                              "id":  "EG2809",
                              "name":  "مدينة توشكى الجديدة",
                              "latitude":  22.856,
                              "longitude":  31.661
                          },
                          {
                              "id":  "EG2807",
                              "name":  "مركز أبوسنبل",
                              "latitude":  22.624,
                              "longitude":  32.599
                          },
                          {
                              "id":  "EG2803",
                              "name":  "مركز أدفو",
                              "latitude":  25.061,
                              "longitude":  32.957
                          },
                          {
                              "id":  "EG2802",
                              "name":  "مركز أسوان",
                              "latitude":  23.972,
                              "longitude":  32.831
                          },
                          {
                              "id":  "EG2806",
                              "name":  "مركز دراو",
                              "latitude":  24.326,
                              "longitude":  33.001
                          },
                          {
                              "id":  "EG2804",
                              "name":  "مركز كوم امبو",
                              "latitude":  24.48,
                              "longitude":  32.947
                          },
                          {
                              "id":  "EG2805",
                              "name":  "مركز نصر",
                              "latitude":  24.373,
                              "longitude":  32.932
                          }
                      ]
    },
    {
        "id":  "EG29",
        "name":  "الأقصر",
        "latitude":  25.658,
        "longitude":  32.725,
        "districts":  [
                          {
                              "id":  "EG2900",
                              "name":  "خارج الزمام",
                              "latitude":  25.634,
                              "longitude":  32.716
                          },
                          {
                              "id":  "EG2901",
                              "name":  "قسم الأقصر",
                              "latitude":  25.707,
                              "longitude":  32.67
                          },
                          {
                              "id":  "EG2902",
                              "name":  "مركز الأقصر",
                              "latitude":  25.685,
                              "longitude":  32.588
                          },
                          {
                              "id":  "EG2903",
                              "name":  "مركز شرطة طيبة",
                              "latitude":  25.738,
                              "longitude":  32.703
                          }
                      ]
    },
    {
        "id":  "EG31",
        "name":  "البحر الأحمر",
        "latitude":  25.588,
        "longitude":  33.944,
        "districts":  [
                          {
                              "id":  "EG3102",
                              "name":  "قسم القصير",
                              "latitude":  25.957,
                              "longitude":  33.951
                          },
                          {
                              "id":  "EG3101",
                              "name":  "قسم أول الغردقة",
                              "latitude":  27.129,
                              "longitude":  33.244
                          },
                          {
                              "id":  "EG3108",
                              "name":  "قسم ثان الغردقة",
                              "latitude":  27.745,
                              "longitude":  33.08
                          },
                          {
                              "id":  "EG3107",
                              "name":  "قسم حلايب",
                              "latitude":  22.386,
                              "longitude":  36
                          },
                          {
                              "id":  "EG3105",
                              "name":  "قسم رأس غارب",
                              "latitude":  28.506,
                              "longitude":  32.377
                          },
                          {
                              "id":  "EG3103",
                              "name":  "قسم سفاجا",
                              "latitude":  26.732,
                              "longitude":  33.46
                          },
                          {
                              "id":  "EG3106",
                              "name":  "قسم شلاتين",
                              "latitude":  23.079,
                              "longitude":  34.574
                          },
                          {
                              "id":  "EG3104",
                              "name":  "قسم مرسى علم",
                              "latitude":  24.707,
                              "longitude":  34.286
                          }
                      ]
    },
    {
        "id":  "EG32",
        "name":  "الوادي الجديد",
        "latitude":  24.719,
        "longitude":  28.709,
        "districts":  [
                          {
                              "id":  "EG3203",
                              "name":  "مركز الفرافرة",
                              "latitude":  27.205,
                              "longitude":  26.76
                          },
                          {
                              "id":  "EG3201",
                              "name":  "مركز الواحات الخارجة",
                              "latitude":  24.964,
                              "longitude":  31.013
                          },
                          {
                              "id":  "EG3202",
                              "name":  "مركز الوحات الداخلة",
                              "latitude":  24.803,
                              "longitude":  27.209
                          },
                          {
                              "id":  "EG3204",
                              "name":  "مركز باريس",
                              "latitude":  22.737,
                              "longitude":  30.412
                          }
                      ]
    },
    {
        "id":  "EG33",
        "name":  "مطروح",
        "latitude":  29.667,
        "longitude":  27.403,
        "districts":  [
                          {
                              "id":  "EG3302",
                              "name":  "قسم الحمام",
                              "latitude":  29.804,
                              "longitude":  29.418
                          },
                          {
                              "id":  "EG3308",
                              "name":  "قسم الساحل الشمالى-جزء",
                              "latitude":  30.861,
                              "longitude":  29.281
                          },
                          {
                              "id":  "EG3303",
                              "name":  "قسم السلوم",
                              "latitude":  30.646,
                              "longitude":  25.255
                          },
                          {
                              "id":  "EG3305",
                              "name":  "قسم سيدى برانى",
                              "latitude":  30.656,
                              "longitude":  25.886
                          },
                          {
                              "id":  "EG3307",
                              "name":  "قسم مارينا العلمين السياحية",
                              "latitude":  30.782,
                              "longitude":  28.74
                          },
                          {
                              "id":  "EG3301",
                              "name":  "قسم مرسى مطروح",
                              "latitude":  30.022,
                              "longitude":  26.997
                          },
                          {
                              "id":  "EG3304",
                              "name":  "مركز الضبعة",
                              "latitude":  29.463,
                              "longitude":  28.243
                          },
                          {
                              "id":  "EG3306",
                              "name":  "مركز سيوة",
                              "latitude":  28.703,
                              "longitude":  25.589
                          }
                      ]
    },
    {
        "id":  "EG34",
        "name":  "شمال سيناء",
        "latitude":  30.425,
        "longitude":  33.701,
        "districts":  [
                          {
                              "id":  "EG3406",
                              "name":  "قسم الحسنة",
                              "latitude":  30.288,
                              "longitude":  33.542
                          },
                          {
                              "id":  "EG3408",
                              "name":  "قسم الشيخ زويد",
                              "latitude":  30.918,
                              "longitude":  33.971
                          },
                          {
                              "id":  "EG3411",
                              "name":  "قسم القسيمة",
                              "latitude":  30.464,
                              "longitude":  34.301
                          },
                          {
                              "id":  "EG3401",
                              "name":  "قسم أول العريش",
                              "latitude":  31.12,
                              "longitude":  33.824
                          },
                          {
                              "id":  "EG3405",
                              "name":  "قسم بئر العبد",
                              "latitude":  30.69,
                              "longitude":  33.102
                          },
                          {
                              "id":  "EG3403",
                              "name":  "قسم ثالث العريش",
                              "latitude":  30.995,
                              "longitude":  33.777
                          },
                          {
                              "id":  "EG3402",
                              "name":  "قسم ثان العريش",
                              "latitude":  31.09,
                              "longitude":  33.751
                          },
                          {
                              "id":  "EG3404",
                              "name":  "قسم رابع العريش",
                              "latitude":  30.851,
                              "longitude":  33.596
                          },
                          {
                              "id":  "EG3409",
                              "name":  "قسم رفح",
                              "latitude":  31.087,
                              "longitude":  34.227
                          },
                          {
                              "id":  "EG3410",
                              "name":  "قسم رمانة",
                              "latitude":  30.957,
                              "longitude":  32.699
                          },
                          {
                              "id":  "EG3407",
                              "name":  "قسم نخل",
                              "latitude":  29.909,
                              "longitude":  34.024
                          }
                      ]
    },
    {
        "id":  "EG35",
        "name":  "جنوب سيناء",
        "latitude":  28.836,
        "longitude":  33.902,
        "districts":  [
                          {
                              "id":  "EG3503",
                              "name":  "قسم أبو رديس",
                              "latitude":  29.049,
                              "longitude":  33.598
                          },
                          {
                              "id":  "EG3501",
                              "name":  "قسم الطور",
                              "latitude":  28.365,
                              "longitude":  33.753
                          },
                          {
                              "id":  "EG3506",
                              "name":  "قسم دهب",
                              "latitude":  28.73,
                              "longitude":  34.451
                          },
                          {
                              "id":  "EG3502",
                              "name":  "قسم رأس سدر",
                              "latitude":  29.599,
                              "longitude":  33.317
                          },
                          {
                              "id":  "EG3504",
                              "name":  "قسم سانت كاترين",
                              "latitude":  28.66,
                              "longitude":  34.052
                          },
                          {
                              "id":  "EG3505",
                              "name":  "قسم شرم الشيخ",
                              "latitude":  28.08,
                              "longitude":  34.203
                          },
                          {
                              "id":  "EG3508",
                              "name":  "قسم طابا",
                              "latitude":  29.501,
                              "longitude":  34.84
                          },
                          {
                              "id":  "EG3507",
                              "name":  "قسم نويبع",
                              "latitude":  29.314,
                              "longitude":  34.312
                          }
                      ]
    }
]
;
