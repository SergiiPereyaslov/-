# Аудит обладнання «Дніпрограф»: перевірені можливості, синергії та B2B-продукти без нових капвкладень

Notes language: mixed UA/EN. The shop's exact configurations, options, condition, wear and load are unknown. Every spec below is the manufacturer's (or a dealer's, where marked) nominal figure for the model, not a measurement of Dniprograf's units. **[V]** = verified with a cited source. **[D]** = dealer or reseller listing only, so treat with caution. **[A]** = assumption or inference, not usable as a hard number in economics.

---

## KQ1. Перевірені технічні можливості кожної з 12 машин (формат, матеріали, швидкість, товщина, роздільна здатність)

### Takeaway
The fleet covers a full short-run chain:
- SRA3+ toner colour (Ricoh)
- one-colour high-volume duplicating (Riso)
- saddle-stitch booklets with collating (Duplo 350 system)
- guillotine cutting (IDEAL 5260)
- sheet lamination and toner foiling (Tauler)
- 1.6 m UV roll printing (Mimaki)
- roll contour cutting (Graphtec)
- sheet contour cutting: light stickers on the Vulcan, up to 6 mm board/corrugated/foam with creasing on the iECHO PK Plus

The main missing links are:
- **no wide-format roll laminator.** Floor graphics, car wrap and laminated roll stickers need a subcontractor or capex.
- **no rigid UV flatbed.** Rigid boards can only be cut or mounted, not printed directly.
- **no slitter/rewinder for roll labels.**
- **no dedicated creaser for heavy covers.**

Two models are ambiguous: the "Ricoh 7500 PRO" and the Riso EZ371E (official EZ371 sheet not found; EZ370 specs used as a proxy).

### Cited Findings

**1. Graphtec FC8600-130 (рулонний ріжучий плотер)**
- [V] Max cutting area 1372 mm × 50 m. Compatible media width 50–1529 mm. Max media thickness 1.48 mm (59.1 mil). Max speed 1485 mm/s diagonal. Cutting force 20–600 gf in 48 steps. Sheet cutter max 11 mil incl. liner. — [Graphtec FC8600 Series spec sheet (Prisco)](https://prisco.com/wp-content/uploads/2017/10/PriscoDigital_Graphtec-FC8600-Series-Brochrue_0617.pdf)
- [V] Compatible media: self-adhesive vinyl, fluorescent film, reflective film, high-intensity and prismatic reflective sheeting (optional push rollers may be needed), sandblast resist rubber, window tint film, paint protection film. — [same spec sheet](https://prisco.com/wp-content/uploads/2017/10/PriscoDigital_Graphtec-FC8600-Series-Brochrue_0617.pdf)
- [V] 5th-generation ARMS (Advanced Registration Mark Sensing). Software included: Graphtec Studio, plus the Cutting Master 3 plug-in for Illustrator and CorelDraw. Interfaces USB 2.0, RS-232C, Ethernet. — [same spec sheet](https://prisco.com/wp-content/uploads/2017/10/PriscoDigital_Graphtec-FC8600-Series-Brochrue_0617.pdf)
- [D] ARMS 5.0 has better sensitivity on media of varying brightness/colour, about 30% faster mark detection, and can read white marks on black. — [Graphtec FC8600 search summary / dealer pages, e.g. MyBinding](https://www.mybinding.com/graphtec-fc8600-130-54-vinyl-cutter-and-plotter-with-stand.html)

**2. Vulcan SC-350 (настільний листовий плотер)**
- [D] Sold in Spain as "Nepata Vulcan SC-350" (brand Vulcan). It is a semi-automatic sheet-fed half-cut (kiss-cut) cutter for stickers/labels. Specs:
  - Sheet size max 350 × 500 mm, min 185 × 150 mm (A4, A3, SRA3, A3+)
  - Automatic feed tray up to 300 sheets
  - **High-resolution CCD camera** for mark reading
  - Max cutting pressure 400 g
  - Max media weight 350 g/m²
  - Speed 10–1200 mm/s; mechanical resolution 0.01254 mm
  - SignCut Pro 2 licence with plug-ins for Illustrator, CorelDraw and Inkscape
  - Creasing not mentioned
  - Source: [Manutan.es product page](https://www.manutan.es/es/mas/plotter-de-medio-corte-nepata-vulcan-sc-350-ideal)
- [D] Also listed by a Kazakh marketplace as a cutting plotter. A 2023 PrintPlanet resale ad priced a new unit at about €3,500. — [Satu.kz](https://satu.kz/Plottery); [PrintPlanet](https://printplanet.com/threads/vulcan-sc-350-digital-cutter-new.292278/post-305443)
- I found no manufacturer website or datasheet. All figures are distributor-level.

**3. Riso EZ 371E (дигітальний дуплікатор)**
- [V for EZ370; proxy for EZ371] EZ370 technical manual:
  - Speed about 60–130 sheets/min in 5 steps
  - Paper max 310 × 432 mm
  - Paper weight 46–210 g/m²
  - Max print area 291 × 413 mm
  - Feed capacity 1000 sheets (64 g/m²)
  - Master-making about 20 s (A4)
  - Variants EZ370E/A/AN; **EZ371 not mentioned**
  - Source: [ManualsLib – Riso EZ Series Technical Manual, p.26](https://www.manualslib.com/manual/4254919/Riso-Ez-Series.html?page=26)
- [D] A reseller describes the "RISO EZ370 EZ371" as a 130 ppm A3 digital duplicator. — [Alibaba listing (via search)](https://french.alibaba.com/f/copieur-risographe.html)
- [V, sister model RZ390, same family logic] "600e dpi" means 300×600 scan data enhanced to emulate 600 dpi. One colour per pass; colour print cylinders (drums) are optional. — [Riso RZ390 spec sheet](https://us.riso.com/wp-content/uploads/assets/legacy/a0LA0000001gBJnMAM.PDF)

**4. Термоклейова машина (модель невідома)**
- [V, generic office thermal binder example: GBC TB500] Binds up to 500 sheets A4 70 g/m² (50 mm) using **pre-made thermal covers**. Manual clamp, timer, cooling tray. — [GBC Europe TB500](https://gbceurope.com/en-nu/products/binding-machines--supplies/thermal-binding-machines/gbc-tb500-heavy-duty-thermal-binding-machine-capacity-500-a4-sheets)
- [D] Generic Chinese A4 thermal binders: 50 mm max (about 480 sheets), about 150 °C, about 3 min warm-up. — [example listing](https://mooremuseum.ca/products/100w-thermal-binding-a4-thermal-binding-machine-50mm-binding/231107972/)
- [V, for comparison of a real inline perfect binder] Ricoh's optional GB5010 perfect binder binds up to 200 sheets with three-edge trimming and covers up to 300 gsm. Dniprograf does NOT own this (it is an inline option). — [Ricoh Pro C7500 spec sheet](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)

**5. Ricoh "7500 PRO"**

Most likely the RICOH Pro C7500 colour sheet-fed press. Ambiguity is discussed under Gaps.
- [V] Launched by Ricoh USA alongside the Pro C9500 (PRINTING United, Oct 2023). It succeeds the Pro C7200 series. — [Cannata Report](https://www.thecannatareport.com/ricoh-pro-c7500/)
- [V] Speed and engine:
  - 85 ppm standard; 95 ppm with the optional Productivity Upgrade Kit
  - Resolution 2400 × 4800 dpi VCSEL
  - 4-drum standard, **5-drum optional**
  - Max monthly volume 240K; duty cycle 1,500K
  - Source: [Ricoh Pro C7500 spec sheet (US)](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [V] Paper weight is tray-dependent:
  - Tray 1: 52–300 gsm; Tray 2: 52–256 gsm
  - Trays 3–8 (optional Vacuum Feed LCIT RT5150): 40–470 gsm (trays 5–8: 40–400)
  - Optional bypass: 52–216 gsm
  - **So 470 gsm needs the optional LCIT.**
  - Source: [same](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [V] Formats:
  - Standard paper up to 13" × 19.2" (330 × 488 mm); max printable 12.7" × 18.9"
  - Oversize up to 13" × 49.6" (1260 mm) with the oversize tray option
  - **Auto duplex up to 13" × 38" (965 mm)**
  - Extension Vacuum Feed Banner Sheet Tray S14 weight limits: 52.3–470 gsm up to 19.2", 52.3–300 gsm for 19.3–27.5", 63.1–300 gsm for 27.6–38"
  - Source: [same](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [V] Ricoh AU page:
  - Max paper 330.2 × 1260 mm; printable 320 × 480 mm standard, 323 × 1252 mm with banner tray
  - Envelopes supported from the bypass and LCIT RT5150
  - Synthetic and magnetic paper "can be fed, quality not guaranteed"
  - Label paper supported with the optional LCIT RT5150
  - Source: [Ricoh Australia Pro C7500](https://www.ricoh.com.au/products/commercial-industrial-printers/production-cut-sheet/pro-c7500)
- [V] 5th colour toners: gold, silver, neon pink, neon yellow, clear, white, invisible red.
  - "5th Color activation plans vary by sales channels" (i.e., an option)
  - Toners can be swapped in under 15 min
  - White is usable as a base layer on coloured/transparent media
  - Yields: white 19.0K, clear 30.5K, gold/silver 22.5K prints/bottle at 15% coverage
  - Source: [same spec sheet](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [Forum, unofficial] White can run in one pass as an underlayer on dark stock with CMYK on top. — [PrintPlanet via search](https://printplanet.com/goto/post?id=323412)
- [D] "Ricoh Aficio MP C7500" is a different, older office/light-production MFP (about 70 ppm colour / 75 ppm mono per a toner retailer). Its paper specs were not verified. — [Precision Roller](https://precisionroller.com/toner-cartridges-for-ricoh-aficio-mp-c7500/products.html)

**6. Duplo DSC-10/60i (листопідбірник)**
- [V] 10 bins per tower, 65 mm bin capacity, up to 4 towers (40 bins). Air suction belt feeder with the Air Management System. Double/misfeed detection. Reject function, interleaf modes, alternate cover mode. Optional ultrasonic double-feed sensor kit and envelope kit. — [Duplo USA 350 Booklet System spec sheet](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf)
- [V] DSC-10/60i paper weights: fine quality 52–157 gsm; art coated 79–157 gsm; cover 52–300 gsm (cover 79–300 gsm option). — [Duplo USA DSC-10/60i page (via search)](https://www.duplousa.com/product/dsc-10-60i-collator)
- [V] The 350 system sheet lists coated stock as 104.7–157 gsm, cover 79–300. This conflicts with the i-page (79 gsm), probably a version difference. — [350 spec sheet](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf)
- [V] Up to 10,000 A4 sets/hour collating (Duplo catalogue claim). — [Duplo catalogue page via search](https://pdcps-pdcpresentationsolutions.dc02.gob2b.com/Catalogue/Document-Finishing/Booklet-Making/Hand-Fed-Booklet-Makers/DBM-350T-Booklet-Maker-MCDU350HF)

**7. Duplo DBM-350 (брошурувальник)**
- [V] Specs from [Duplo USA 350 spec sheet](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf):
  - Saddle stitch & fold sheet size 148 × 210 to 320 × 460 mm
  - **Up to 20 sheets of 81.4 gsm (≤2.1 mm), i.e. 80 pages**
  - 2 DeLuxe stitch heads
  - Speed up to 3,000 sets/h (A5, ≤10 sheets)
  - Memory for 20 jobs; automatic setup of stitch/fold/trim positions
  - Options: small booklet kit (105×240 to 148×430 mm sheets), corner/side stitch, 6-page insert kit
  - Finished saddle-stitch size without trim: 148 × 105 to 320 × 230 mm
- [D] A dealer gives the max cover as 300 g/m² and min sheet A5. — [Machineseeker DBM-350 listing](https://www.machineseeker.com/m-m/i-22390632)

**8. Duplo DBM-350T (тример)**
- [V] Fore-edge (face) trim 1–20 mm. Trim capacity up to 4 mm booklet thickness (≈20 sheets 81.4 gsm). Waste goes to an external bin. Finished size with max trim: 148 × 85 to 320 × 210 mm. — [Duplo 350 spec sheet](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf)

**9. Гільйотина EBA/IDEAL 5260**
- [V] IDEAL 5260 (2019 datasheet), from [IDEAL 5260 datasheet (ES)](https://dhpcomerpa.com/wp-content/uploads/IDEAL_5260_span.pdf):
  - Cutting length 520 mm, cutting height 80 mm, narrow cut 35 mm, table depth 520 mm
  - Electromechanical knife and clamp drive (1.1 kW knife motor), **automatic clamp**
  - Electric programmable backgauge with touch panel, 99 programs × 99 steps
  - Safety light barrier, EASY-CUT two-hand activation
  - 230 V single-phase; 257 kg
- [D] Older EBA-branded 5260 units on the used market list 99 programs × 99 steps. Elmstok lists 9 programs × 9 steps for its 5260, a conflict between generations. — [Machineseeker EBA 5260](https://www.machineseeker.ie/eba-5260/i-17860486); [Elmstok](https://www.elmstok.co.uk/products/ideal-5260-programmable-easy-cut-guillotine)

**10. Mimaki UJV100-160 Plus (рулонний УФ-LED)**
- [V] Specs from [Mimaki global spec page](https://mimaki.com/product/inkjet/i-roll/ujv100-160plus/specification.html):
  - Piezo heads, 2 staggered; 360/720/900/1200 dpi
  - Max print width 1,610 mm; max media width 1,620 mm
  - **Max media thickness 1.0 mm**; roll ≤ φ250 mm, ≤ 45 kg, 2"/3" core
  - Inks LUS-170, LUS-190, LUS-210, each in C, M, Y, K, W, Cl
  - Sets CMYK / CMYK+W / CMYK+W+Cl; availability varies by region
  - Applications: sign & display, window graphics, banner, poster, POP, flag, vehicle wrapping, wallpaper, labels & decals, POS
  - Ink adhesion and weather resistance vary by material; test first; some media need primer
- [V] Mimaki Europe:
  - **LUS-190 available only in the EU; LUS-210 outside the EU.** Both flexible, good adhesion and scratch resistance, GREENGUARD Gold
  - Pull-back printing allows up to 3-layer printing with white/clear
  - Applications: backlit and window signage, labels, floor stickers, canvas, wallpaper
  - RIP: RasterLink7
  - Direct cut-data sending from RasterLink7 works **only when paired with the Mimaki CG-AR cutting plotter**
  - Source: [Mimaki Europe UJV100-160Plus](https://www.mimakieurope.com/products/uv/ujv100-160plus/)
- [D] Speed: 13.6 m²/h (4-colour) per the US spec sheet summary. One table lists 23 m²/h draft for a transparent film set, and print speed is halved with the 4C+W/Cl set. — [Mimaki USA spec sheet (via search)](https://www.mimakiusa.com/wp-content/uploads/2023/12/UJV100-160Plus-Series-Spec-Sheet_4.24.pdf); [CMYUK PDF (via search)](https://www.cmyuk.com/uploads/Mimaki-UJV100-160-plus.pdf)
- [D] LUS-170 "can stretch up to 170%" (retailer). LUS-190 "stretchable up to 190%", for PVC and uncoated PET film and paper (retailer). — [Signmaster LUS-170](https://www.signmaster.co.uk/product/mimaki-lus-170-inks); [Signmaster LUS-190](https://signmaster.co.uk/products/mimaki-lus-190-inks)
- [Forum/trade] UV inks were traditionally brittle (cracking on curves); Mimaki markets flexible inks as an alternative. There is no film-maker (3M/Avery) wrap-warranty documentation for LUS-170/190/210. — [Wide Format Image AU](https://wideformatimage.com.au/?p=26161); [Signs101 thread](https://signs101.com/threads/mimaki-ucjv300-160-vs-mutoh-1682sr.156944/latest)

**11. iECHO PK Plus (планшетний ріжучий стіл)**
- [D] Model is PK0604 Plus (600 × 400 mm) or PK0705 Plus (750 × 530 mm). Source: [Ball & Doggett (dealer)](https://ballanddoggett.com.au/product/automatic-cutting-system):
  - PK: universal cutting tool, creasing wheel, kiss-cut tool, up to 2 mm
  - **PK Plus adds an oscillating tool, up to 6 mm**
  - Speed 1000 mm/s; accuracy ±0.1 mm; vacuum hold-down; formats PLT/DXF/HPGL; 220 V, 4 kW
  - CCD camera contour registration; QR-code file retrieval
  - Roll material feeding option (vinyl, labels and tags)
- [D] PK Plus materials: KT board, PP paper, foam board, stickers, reflective, cardboard, plastic sheet, **corrugated board**, grey board, corrugated plastic, ABS board, magnetic sticker. — [Ball & Doggett](https://ballanddoggett.com.au/product/automatic-cutting-system)
- [D] Fujifilm NZ:
  - Automatic sheet feeder, stack up to 120 mm ≈ 400 sheets of 250 g card
  - Sizes A2 (PK0705 only), A3/A, B1–B4
  - "Cutting from kiss-cut to corrugated board"
  - Aimed at signage, printing and packaging; sample making and short runs
  - **It also lists 2 mm for PK0604 vs 6 mm for PK0705**, i.e. possibly the non-Plus PK0604
  - Source: [Fujifilm NZ PK0604/PK0705](https://www.fujifilm.com/fbnz/en/products/graphic/wide-format/iecho-pk0604-and-pk0705)
- [D] Speed conflict: 1000 mm/s (dealers) vs 1500 mm/s (a 2025 user report). — [PrintWeek India – Boxcraft](https://www.printweek.in/news/boxcraft-crafts-impressive-prototypes-with-iecho-60808)

**12. Ламінатор Tauler з функцією фольгування (модель невідома)**
- [V, trade press] Tauler is a Spanish laminator maker. Models:
  - 52 cm PrintLam Smart (to 15 m/min), SmartMatic (to 20 m/min), B3 Smart (7 m/min)
  - Larger CTI/CTIS: 750 × 1050 and 1050 × 1050 mm
  - Source: [PrintWeek – Watkiss/Tauler](https://printweek.com/content/product-news/watkiss-secures-exclusive-uk-tauler-laminator-distribution-deal); [PrintWeek – Binding Store](https://printweek.com/content/news/binding-store-acquires-sole-uk-distribution-deal-for-tauler-laminators)
- [V, trade press] The **Tauler Foil kit** (shown with the SmartB3 Matic) applies metallic colours, holographic effects or a varnish effect **onto a surface previously printed with toner**, i.e. toner-reactive foil (sleeking). — [Interempresas](https://www.interempresas.net/Graficas/203200-Tauler-presenta-laminadora-SmartB3-Matic-kit-Tauler-Foil-The-Print-Show-Viscom-Italia.html); [Interempresas C!Print](https://www.interempresas.net/Envase/223242-Tauler-presenta-en-C-Print-Madrid-la-laminadora-SmartB3Matic-y-el-kit-Tauler-Foil.html?R=219007)
- [D] PrintLam Smart 52 sheet range 150 × 200 to 520 × 720 mm, 15 m/min. — [Digital Printer mag (via search)](https://www.digitalprintermag.co.uk/?p=31711)
- [V, trade press] Tauler pressure roller up to 6 bar, substrates "from 120 gsm up to 450 gsm". This is a general statement for a Tauler model, not confirmed for Dniprograf's unit. — [PrintWeek Allstar](https://www.printweek.com/content/news/allstar-services-adds-tauler-printlam)
- No Ukrainian Tauler dealer or UA-market model page was found. Known distributors: UK (Binding Store), Italy (Plastitech). — [Tauler UA search; SmartB3Matic catalogue](https://www.interempresas.net/FeriaVirtual/Catalogos_y_documentos/82195/SmartB3Matic-v2-ESP.pdf)

### Inferences
- [A] Ricoh "7500 PRO" ≈ Pro C7500. No Ricoh model called "Pro 7500" exists in current Ricoh literature. The alternative reading, the Aficio MP C7500 (about 2007, office class), would have far weaker heavy-stock and banner capability. **Economics should not count on these unless the shop confirms the installed options:**
  - 5th colour, which is optional and needs activation
  - 470 gsm, which needs the LCIT RT5150
  - banner sheets, which need the banner trays
  - In base configuration, plan on ≤300 gsm (tray 1), SRA3+ (330 × 488), and duplex up to 13×38" only if a banner tray is present.
- [A] Riso EZ371E is almost certainly a variant of the EZ370 A3 family ("E" = European). Plan on: one colour per drum pass, 46–210 gsm, 130 ppm, max print area 291 × 413 mm. The economic break-even vs Ricoh toner click typically sits at tens to low hundreds of copies per original; no source found, so the exact break-even is unverified.
- [A] The "термоклейова машина" is most likely an office thermal-cover binder (GBC-type). Less likely, it is a desktop hot-melt EVA perfect binder with milling; that type was not verified. Either way:
  - no three-side trimming (the guillotine does it)
  - no PUR
  - limited bond strength on coated toner stock
  - manual, about 1 book per cycle
- [A] The iECHO "PK PLUS" with oscillating knife implies ≤6 mm. That fits:
  - E-flute (~1.5 mm) and B-flute (~3 mm) corrugated
  - 3–5 mm foamboard/PVC foam
  - 300–400 gsm carton board with the creasing wheel
  - It does not fit 10 mm foam/PVC.
  - The bed (600×400 or 750×530) accepts SRA3/13×19" Ricoh sheets. 1260 mm banner sheets and 1.6 m Mimaki prints must be cut in sections (or via roll feeding, if fitted).
- [A] Graphtec FC8600 (≤1.48 mm, ≤600 gf) cuts vinyl, films, roll stickers, reflective film and magnetic sheets only if thin (it cannot handle 0.5–0.8 mm magnet reliably at 600 gf; assumption, not verified). It is not for board.

### Gaps
- I found no official EZ371/EZ371E spec sheet. EZ370 values are used as a proxy.
- I found no official iECHO datasheet (iechocutter.com not retrieved). The 2 mm vs 6 mm and 1000 vs 1500 mm/s conflicts are unresolved. The sheet-feeder presence on Dniprograf's unit is unknown.
- The exact Tauler model, its max sheet size and thickness, and whether it is roll-fed (B3/52 cm sheet-fed) are unknown. No Ukrainian dealer was found.
- Mimaki LUS-210/190 elongation, outdoor durability (years) and primer requirements by substrate are not in official specs. The Mimaki official speed table was not retrieved directly (US PDF 404).
- Vulcan SC-350: no manufacturer-level documentation, only one distributor page.
- Whether Dniprograf's Ricoh has the 5-drum option, LCIT, banner trays or an inline finisher is unknown.
- IDEAL/EBA 5260 generation (EASY-CUT 2019 vs older EBA) and knife condition are unknown.

---

## KQ2. Продукти, матеріали, економічні тиражі, обмеження, галузі, повторюваність і комбінації — по кожній машині

### Takeaway
The economic sweet spot of the whole fleet is short-to-medium runs: 1 to ~2,000 sheets or ~1–300 m² per job. The fleet is especially strong in fast-turn, variable and repeat B2B materials:
- POS and price communication
- stickers and labels
- booklets and manuals
- short-run boxes and packaging prototypes
- signage on films
- event kits

Large-run labels and packaging, offset-scale booklets, rigid direct print and laminated wide-format graphics are outside the economic zone.

### Cited Findings
- [V] The Ricoh Pro C7500 brochure itself positions the press for "instruction pamphlets and decorative liners to short-run packaging and unique direct mailers", synthetics, oversize sheets and magnetic media. Invisible red is pitched for "affordable security on certificates and tickets"; white as a base on coloured and transparent media. — [Ricoh Pro C7500 spec sheet](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [V] Duplo positions the 350 system for "medium job lengths": catalogs, newsletters, manuals, corporate reports, half-letter brochures, booklets with raised UV covers. — [Duplo 350 spec sheet](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf)
- [V] Mimaki lists for the UJV100-160Plus: sign & display, window graphics, banner, poster, POP, flag, vehicle wrapping, wallpaper, labels & decals, POS display. Case studies cover window film, frosted glass, shelf wobblers and stickers. — [Mimaki spec page](https://mimaki.com/product/inkjet/i-roll/ujv100-160plus/specification.html)
- [D] iECHO PK is aimed at "sample making and short-run customized production" in signage, printing and packaging. — [Fujifilm NZ](https://www.fujifilm.com/fbnz/en/products/graphic/wide-format/iecho-pk0604-and-pk0705)
- [D] A PK user (Boxcraft, India) uses iECHO for packaging prototypes. — [PrintWeek India](https://www.printweek.in/news/boxcraft-crafts-impressive-prototypes-with-iecho-60808)
- [V] The Riso RZ/EZ family is positioned for newsletters, calendars, posters and menus (RZ390 brochure). — [Riso RZ390 spec sheet](https://us.riso.com/wp-content/uploads/assets/legacy/a0LA0000001gBJnMAM.PDF)
- [V] The Graphtec FC8600 media list includes reflective and prismatic sheeting, sandblast resist and window tint. These are relevant for safety and road signage, glass decoration and window film. — [Graphtec spec](https://prisco.com/wp-content/uploads/2017/10/PriscoDigital_Graphtec-FC8600-Series-Brochrue_0617.pdf)

### Inferences — per-machine profile

All rows below are [A], built from the cited specs and print-trade practice. The run ranges are planning hypotheses, not sourced figures.

| # | Машина | Ключові продукти | Матеріали | Економічний тираж (гіпотеза) | Обмеження | B2B-галузі | Повторюваність | Комбінації |
|---|---|---|---|---|---|---|---|---|
| 1 | Graphtec FC8600-130 | Плотерна порізка плівки (вивіски, вітрини, логотипи), контурна порізка наклейок з рулону (після Mimaki), світловідбивні знаки, трафарети, тонувальні/матові (sandblast) плівки | Самоклейний вініл, світловідбивні, флуоресцентні, матові, тонувальні плівки ≤1.48 мм | 1 – ~200 м.п. на замовлення; наклейки до ~кількох тисяч шт., якщо не потрібна висічка на валу | Немає слітера/перемотки; ручне вибирання (weeding) — трудомістко; сила 600 gf — не для картону | Рітейл, HoReCa, автосалони, логістика/склади (маркування), будівництво, медицина (вивіски) | Висока для маркування/табличок, середня для вітрин (сезонні кампанії) | Mimaki → Graphtec (print&cut); iECHO для листових |
| 2 | Vulcan SC-350 | Листові наклейки kiss-cut (A3/SRA3), етикетки на листах, стікерпаки | Самоклейний папір/плівка ≤350 g/m² | 10 – ~1,000 аркушів (автоподача 300 арк.) | Лише kiss-cut легких матеріалів; немає біговки; дистриб'юторські дані | FMCG/крафтові виробники, e-commerce, кав'ярні, косметика | Висока (етикетки на продукцію) | Ricoh → Vulcan; дублює iECHO для легких робіт (звільняє iECHO під картон) |
| 3 | Riso EZ371E | 1-кольорові бланки, інструкції, вкладиші, анкети, меню-вкладиші, тексти для брошур, навчальні зошити | Офсетний папір 46–210 g/m² | Від ~50–100 копій з оригіналу до десятків тисяч | 1 колір за прогін; немає повноколірного; макс. друк 291×413; фарба повільно висихає | Освіта, медицина, держсектор, виробництво (інструкції), політичні/громадські організації | Висока (бланки, навчальні матеріали) | Riso → DSC-10/60i → DBM-350/350T (блок брошури) + обкладинка Ricoh |
| 4 | Термоклей | Звіти, дипломні/технічні документи, каталоги малих тиражів, блокноти (з обкладинкою) | Офісний 70–100 g/m², обкладинки | 1 – ~50 прим. | Ручна, повільна; обмежена міцність на крейдованому папері; потрібне обрізання на гільйотині | Юридичні, консалтинг, проектні бюро, ВНЗ | Середня | Ricoh/Riso → термоклей → IDEAL 5260 |
| 5 | Ricoh (Pro C7500?) | Листівки, POS (воблери, шелфтокери, тейбл-тенти), обкладинки, сертифікати, етикетки на листах, коробки з картону, бірки, меню, банерні аркуші (якщо є лоток), конверти, VDP | 52–300 (470 з LCIT) g/m², самоклейні, синтетичні (без гарантії якості), конверти | 1 – ~5,000 аркушів SRA3 | Формат SRA3+; heavy stock і banner — залежить від опцій; 5-й колір — опція | Майже всі | Висока | Центр усіх комбінацій |
| 6 | DSC-10/60i | Підбір багатосторінкових комплектів, NCR-подібні набори (з Riso), підбір блоків для брошур | 52–157 g/m² блок, обкладинка до 300 | 100 – 10,000 комплектів | Тільки офлайн; потрібно ≤10 сторінок-аркушів на вежу | Освіта, виробництво, медицина, видавці | Висока | Головна ланка брошурувальної лінії |
| 7–8 | DBM-350 + 350T | Брошури на скобі A5/A4/«альбомні» до 80 стор., каталоги, інструкції, програмки подій, меню | Див. вище | 50 – ~5,000 брошур | ≤20 аркушів 81 g/m²; тільки обріз по передньому краю — верх/низ на гільйотині, якщо bleed | Фарма, виробництво, HoReCa, освіта, івенти, девелопери | Висока (щорічні/квартальні каталоги, інструкції) | Ricoh/Riso → DSC → DBM → (IDEAL) |
| 9 | IDEAL 5260 | Порізка всього листового: візитки, листівки, бірки, брошури (верх/низ), блоки | Стос ≤80 мм, ширина ≤520 мм | Будь-який | Тільки прямі різи; вузький різ ≥35 мм | — | — | Фінішер для Ricoh/Riso/брошур/книжок |
| 10 | Mimaki UJV100-160 Plus | Банери, плівки для вітрин (у т.ч. з білим — на прозорі), backlit, постери, шпалери, наклейки/декалі з рулону, плакати, полотно | Рулонні ≤1.0 мм, ≤1.61 м друку | 1 – ~300 м² на замовлення (13.6 м²/год 4C [D]) | Немає жорсткого друку; немає широкоформатного ламінатора; білий/лак вдвічі повільніше [D] | Рітейл, ТРЦ, девелопери, HoReCa, авто, медицина, освіта | Середня-висока (сезонні кампанії, вітрини) | Mimaki → Graphtec; Mimaki → iECHO (листові фрагменти: наклейки, магніти, монтаж на піну) |
| 11 | iECHO PK Plus | Коробки малих тиражів і прототипи, ложементи/вкладиші (пінополіетилен — не перевірено), POS: воблери, шелфтокери, хенгери, дисплеї з картону; етикетки на листах; таблички з PVC/foamboard; магніти | Картон до 400+ g/m², гофро ≤6 мм, foam/KT ≤6 мм, ABS, PP, магнітний вініл | 1 – ~500 (іноді до 1–2 тис.) аркушів | Поле 600×400 або 750×530; швидкість на аркуш для складного контуру — хвилини; не для тиражів 5–10 тис. | FMCG, косметика, фарма (мало), ремісничі виробники, e-commerce, агенції | Висока для прототипів/POS кампаній | Ricoh → (Tauler) → iECHO; Mimaki → монтаж → iECHO |
| 12 | Tauler (ламінація + фольга) | Ламінування обкладинок, меню, візиток, коробок; тонерна фольга (золото/срібло/голограма) на запрошеннях, сертифікатах, коробках, бірках | Тонерні відбитки (Ricoh) ~120–450 g/m² [D] | 1 – ~2,000 аркушів | Фольга тільки на тонер (не на Riso-фарбу, не на УФ-друк — [A]); модель невідома | Подарункові, HoReCa, бʼюті, корпоративні подарунки, освіта (сертифікати) | Середня (сезонні) | Ricoh → Tauler → iECHO / IDEAL |

---

## KQ3. Матриця «Обладнання → Продукт → B2B-клієнт → Частота попиту → Економічний потенціал»

### Takeaway
The highest-potential lines that need zero capex are:
1. POS and price-communication kits for retail/HoReCa (Ricoh + iECHO/IDEAL)
2. sheet labels/stickers (Ricoh + Vulcan/iECHO)
3. short-run boxes and sleeves (Ricoh + Tauler + iECHO)
4. booklets and manuals (Ricoh/Riso + Duplo)
5. window/interior films and decals (Mimaki + Graphtec)

All matrix ratings are qualitative inferences. No Ukrainian market pricing was verified in this research thread.

### Cited Findings
- [V] The Ricoh brochure explicitly targets short-run packaging, direct mail, instruction pamphlets, synthetics and magnetic media. — [Ricoh spec sheet](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [V] Mimaki lists POS display and labels/decals as target apps for the UJV100-160Plus. — [Mimaki](https://mimaki.com/product/inkjet/i-roll/ujv100-160plus/specification.html)
- [V] Duplo positions the 350 system for catalogs, newsletters and corporate reports. — [Duplo](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf)

### Inferences — matrix

All rows are [A]. Potential: H/M/L. Frequency is the typical B2B reorder cycle.

| Обладнання | Продукт | B2B-клієнт | Частота | Потенціал |
|---|---|---|---|---|
| Ricoh + IDEAL (+iECHO для фігурних) | Цінники, шелфтокери, воблери, хенгери, тейбл-тенти | Продуктові/аптечні мережі, HoReCa, АЗС, дистриб'ютори FMCG | Щотижня–щомісяця (промо-цикли) | H |
| Ricoh + Vulcan/iECHO | Етикетки на листах, наклейки | Крафтові харчові, кав'ярні, косметика, e-commerce | Щомісяця | H |
| Ricoh + Tauler + iECHO | Коробки 300–400 g/m², слівери, вкладиші, бірки | Косметика, кондитерські, подарункові, e-commerce, корпоративні подарунки | Сезонно/щоквартально | H |
| Ricoh/Riso + DSC + DBM-350/350T | Брошури, каталоги, інструкції, програмки | Виробники, фарма-дистрибутори, освіта, HoReCa, івенти | Щоквартально/щорічно | M–H |
| Riso (+DSC) | Бланки, анкети, навчальні матеріали, 1-кол. інструкції | Освіта, медзаклади, держсектор, промисловість | Щомісяця | M |
| Mimaki + Graphtec | Вітринні плівки, наклейки-декалі, backlit, інтерʼєрні плівки, маркування | Рітейл, ТРЦ, банки, медклініки, автодилери | Сезонно (4–8 р/рік) | M–H |
| Mimaki | Банери, постери, шпалери | Девелопери, івенти, рітейл | Нерегулярно/проєктно | M |
| Graphtec | Світловідбивні/безпекові знаки, маркування складів, трафарети | Промисловість, логістика, будівництво | Щоквартально | M |
| iECHO (+Mimaki/Ricoh) | Таблички на PVC/foamboard, POS-дисплеї з картону/гофри, магніти | Рітейл, агенції, фарма-промо | Проєктно | M |
| Ricoh + Tauler (фольга) | Сертифікати, запрошення, дипломи, VIP-візитки | Освіта, корпоративи, івент-агенції | Сезонно | M |
| Ricoh + термоклей + IDEAL | Звіти, блокноти/планери малими тиражами | Корпорації, консалтинг, ВНЗ | Щорічно (планери — Q4) | L–M |

---

## KQ4. Перевірка 5 технологічних комбінацій (a–e)

### Takeaway
All five chains are technically compatible on the cited specs, with specific conditions:
- **(a)** works within SRA3/13×19". Heavy and banner stock depends on Ricoh options.
- **(b)** works, but the Mimaki→Graphtec handoff is not native (RasterLink7 direct-cut only supports Mimaki CG-AR). Use Cutting Master/Graphtec Studio registration marks and manage mark size and margins.
- **(c)** is limited to ≤20 sheets 81 gsm (80 pp). The DBM-350T trims the fore-edge only, so bleed booklets need head/foot trimming on the IDEAL.
- **(d)** works if foil is applied before die-less cutting and only on toner areas.
- **(e)** is feasible only for small manual runs on an office-class binder.

### Cited Findings
**(a) Ricoh + cutting (iECHO/Vulcan/IDEAL) + lamination (Tauler)**
- [V] Ricoh max standard paper is 13 × 19.2"; heavy 300 gsm comes from tray 1 and 470 gsm only from the optional LCIT. — [Ricoh spec sheet](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [D] The Vulcan SC-350 takes sheets up to 350 × 500 mm and ≤350 g/m², with a CCD camera. — [Manutan](https://www.manutan.es/es/mas/plotter-de-medio-corte-nepata-vulcan-sc-350-ideal)
- [D] The iECHO PK bed is 600 × 400 / 750 × 530 with a CCD camera for printed-sheet registration. The feeder stacks 120 mm ≈ 400 sheets of 250 g. — [Fujifilm NZ](https://www.fujifilm.com/fbnz/en/products/graphic/wide-format/iecho-pk0604-and-pk0705)
- [V] IDEAL 5260 cuts up to 520 mm width with an 80 mm stack. — [IDEAL datasheet](https://dhpcomerpa.com/wp-content/uploads/IDEAL_5260_span.pdf)
- [D] Tauler PrintLam Smart 52 takes sheets up to 520 × 720 mm. — [Digital Printer](https://www.digitalprintermag.co.uk/?p=31711)

**(b) Mimaki UV roll + Graphtec contour (ARMS)**
- [V] RasterLink7 sends cut data directly only with the Mimaki CG-AR cutter. — [Mimaki Europe](https://www.mimakieurope.com/products/uv/ujv100-160plus/)
- [V] The Graphtec FC8600 has ARMS 5 and ships Graphtec Studio plus the Cutting Master 3 plug-in (Illustrator/CorelDraw). — [Graphtec spec](https://prisco.com/wp-content/uploads/2017/10/PriscoDigital_Graphtec-FC8600-Series-Brochrue_0617.pdf)
- [Forum, practical] Reported failures and fixes on Graphtec print & cut with Mimaki/RasterLink-printed marks:
  - the cutter failed to scan marks placed in Cutting Master 3 and printed through RasterLink
  - insufficient white space after marks
  - mark size mismatch between software and cutter causes drift
  - artwork must sit fully outside the marks
  - Sources: [Signs101 print & cut issues](https://signs101.com/threads/print-and-cut-issues.136679/); [Signs101 FC8600 not cutting after marks](https://www.signs101.com/threads/graphtec-fc8600-160-not-cutting-after-reading-registration-marks.146112/); [UKSignboards](https://uksignboards.com/forums-2/discussion/reg-marks-inside-of-graphic/)
- [V] Mimaki: ink adhesion and weather resistance vary by material; some need primer. — [Mimaki spec](https://mimaki.com/product/inkjet/i-roll/ujv100-160plus/specification.html)

**(c) Riso/Ricoh → DSC-10/60i → DBM-350 → DBM-350T**
- [V] All specs from [Duplo 350 spec sheet](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf):
  - Collator: fine 52/64–157 gsm, cover 52–300 gsm, 65 mm bins
  - Booklet maker: sheets 148×210 to 320×460 mm; up to 20 sheets 81.4 gsm
  - Finished size untrimmed 148×105 to 320×230
  - Trimmer: fore-edge 1–20 mm, capacity 4 mm
  - Optional DSS-350 square spine (not in Dniprograf's list)
- [V] Riso paper 46–210 gsm, max 310 × 432 mm (EZ370 proxy). An A4 booklet needs an A3 sheet (297×420), within the EZ370 range. — [ManualsLib EZ370](https://www.manualslib.com/manual/4254919/Riso-Ez-Series.html?page=26)
- [V] Ricoh SRA3/13×19.2" sheets (330×488 mm) **exceed the DBM-350 max sheet 320×460 mm**. Ricoh sheets for the Duplo must be cut to ≤320×460, e.g. 320×450 for A4 with bleed, or printed on A3/SRA3-reduced stock. — [Ricoh spec](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf); [Duplo spec](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf)

**(d) Ricoh toner print + Tauler toner foil + iECHO die-less cutting**
- [V, trade press] The Tauler Foil kit applies metallic, holographic or varnish-effect foil onto toner-printed areas. — [Interempresas](https://www.interempresas.net/Graficas/203200-Tauler-presenta-laminadora-SmartB3-Matic-kit-Tauler-Foil-The-Print-Show-Viscom-Italia.html)
- [V] Ricoh alternatively offers gold/silver 5th-colour toner (if the 5-drum option is installed). — [Ricoh spec](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [D] iECHO kiss-cut, through-cut and creasing wheel, with CCD registration. — [Ball & Doggett](https://ballanddoggett.com.au/product/automatic-cutting-system)

**(e) Print + термоклей (soft-cover catalogs, notebooks, reports)**
- [V] Office thermal binders bind up to 50 mm / 500 sheets 70 gsm with pre-made covers. — [GBC TB500](https://gbceurope.com/en-nu/products/binding-machines--supplies/thermal-binding-machines/gbc-tb500-heavy-duty-thermal-binding-machine-capacity-500-a4-sheets)
- [V] The IDEAL 5260 80 mm stack and 35 mm narrow cut allow three-side trim of bound books. — [IDEAL](https://dhpcomerpa.com/wp-content/uploads/IDEAL_5260_span.pdf)

### Inferences
- **(a) [A]** Recommended route: Ricoh (SRA3+) → Tauler laminate (matt/gloss/soft-touch) → iECHO (shapes, creases, kiss-cut) or IDEAL (rectangles).
  - The Vulcan should take light kiss-cut sticker sheets so the iECHO stays free for board.
  - Laminate before cutting. CCD registration on the iECHO and Vulcan tolerates small sheet distortion from lamination heat. If reflections from gloss laminate interfere with mark reading (unverified), use matt.
  - Banner-sheet products (e.g. 330×1200 mm shelf strips) exceed the iECHO bed and Tauler width limits on length. Cut on the IDEAL only if rectangular (≤520 mm cut length means pre-cutting long sheets crosswise).
- **(b) [A]** Workflow:
  1. Design in Illustrator/CorelDraw
  2. Cutting Master 3/4 adds ARMS marks and the cut contour
  3. Export the print file with marks to RasterLink7, print on the UJV100
  4. Allow cure/outgassing
  5. Load on the FC8600, read marks with ARMS, cut
  - Compatible, but needs a calibrated mark template; it is not a one-click workflow.
  - No wide-format laminator means unlaminated UV output. UV ink is more scratch-resistant than solvent (Mimaki claims), but floor graphics, car wraps and high-abrasion labels need lamination → subcontract.
  - Roll labels: the Graphtec cuts but does not slit, rewind or strip matrix. That is fine for 50–2,000 stickers on sheets/strips, uneconomic for thousands of roll labels for labelling machines.
- **(c) [A]** Typical outputs:
  - A5 booklet (A4 sheets, ≤80 pp)
  - A4 booklet (A3 sheets, ≤80 pp)
  - A4 landscape/square formats within 320×230 finished
  - Riso can print text blocks (1–2 colours via drum change) and Ricoh the cover (≤300 gsm, collator cover range).
  - Risks:
    - Riso ink set-off/drying time before collating
    - heavy coated toner covers cracking on fold (no dedicated creaser listed; pre-crease on the iECHO creasing wheel for small runs)
    - head/foot trim of bleed booklets must be done on the IDEAL, because the DBM-350T trims the face only
    - covers are limited to 300 gsm by the Duplo specs even though the Ricoh can print 470
- **(d) [A]** Sequence: Ricoh prints CMYK. Areas to be foiled are printed as solid toner (usually K) in the same pass or a separate pass. Then Tauler foil, optionally laminate around the foil (the foil must not be under the laminate if the effect is to stay visible; foil can sit over matt laminate only with special foils, not verified), then iECHO contour/crease using CCD marks.
  - Foil works only on toner, not on Riso soy ink and not on UV-cured Mimaki prints. This is inferred from "previously printed with toner".
  - Products: gift boxes, tags, invitations, certificates, premium business cards, labels with metallic accents.
- **(e) [A]** Feasible for 1–50 copies of reports and soft-cover catalogues and for notebooks/planners where the block is 70–100 gsm uncoated.
  - Not suited to coated-paper catalogues with heavy daily use, because EVA adhesion on coated toner stock is weak (industry knowledge, not verified here).
  - Not suited to runs above ~100 copies, which should be saddle-stitched (≤80 pp) or subcontracted to a PUR binder.

### Gaps
- No primary Mimaki/Graphtec joint workflow document was found. The Graphtec Cutting Master version compatible with RasterLink7 output is unverified.
- Tauler foil adhesion on Ricoh Pro C7500 toner (both use dry toner) is plausible but not tested in any found source.
- iECHO CCD reading through gloss laminate is unverified.
- Whether Dniprograf's iECHO has the sheet feeder and roll-feeding unit is unknown.

---

## KQ5. Що можна продавати B2B вже зараз без capex: ≥20 реальних продуктів

### Takeaway
At least 24 products can be produced fully in-house on the existing fleet. About 6 more need a subcontractor for one element (hardware, laminate, offset or large-run labels):
- roll-ups
- floor graphics
- car wrap
- large-run roll labels
- rigid UV
- long-run packaging

Margin formula used throughout [A]:

**Contribution margin = Price − (Substrate + Ink/toner/click + Laminate/foil + Machine-time × Hourly rate + Labour + Setup/makeready + Waste % + Subcontract + Delivery)**

### Cited Findings
These are the technical anchors for the product list, all cited above:
- Ricoh 40/52–470 gsm (options), SRA3+, envelopes, label paper (with LCIT), synthetics and magnetic "can be fed, quality not guaranteed"; 5th colour optional. — [Ricoh AU](https://www.ricoh.com.au/products/commercial-industrial-printers/production-cut-sheet/pro-c7500); [Ricoh spec](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- Mimaki UJV100 ≤1.0 mm roll media, 1.61 m, CMYK+W+Cl, apps incl. window graphics, backlit, labels, floor stickers, wallpaper, POS. — [Mimaki](https://mimaki.com/product/inkjet/i-roll/ujv100-160plus/specification.html); [Mimaki EU](https://www.mimakieurope.com/products/uv/ujv100-160plus/)
- iECHO PK Plus ≤6 mm; corrugated, KT, foam, ABS, magnetic sticker; creasing. — [Ball & Doggett](https://ballanddoggett.com.au/product/automatic-cutting-system)
- Graphtec: reflective, prismatic, window tint, sandblast. — [Graphtec](https://prisco.com/wp-content/uploads/2017/10/PriscoDigital_Graphtec-FC8600-Series-Brochrue_0617.pdf)
- Floor graphics require certified anti-slip laminates (R10/R11 per DIN 51130). Uncertified material is "always less suitable"; durability is about 3 months to 1 year indoors depending on laminate. — [Hexis](https://hexis-graphics.com/en/news-en/self-adhesive-solutions-for-floor-graphics); [Neschen FAQ](https://www.neschen.de/en/floor-graphics-folien-die-10-haeufigsten-fragen/); [Aslan R11](https://wideformatimage.com.au/?p=11177)
- No manufacturer wrap certification was found for LUS-170/190/210. Retailers claim 170%/190% stretch. — [Signmaster](https://www.signmaster.co.uk/product/mimaki-lus-170-inks); [Signs101](https://signs101.com/threads/mimaki-ucjv300-160-vs-mutoh-1682sr.156944/latest)

### Inferences — product list

All rows are [A]. Runs are planning hypotheses. "Складність запуску": Н = низька (є все), С = середня (потрібні шаблони, тест матеріалів, налаштування), В = висока. SUB = потрібен субпідрядник.

| # | Продукт | Покупець | Процес | Машини | Матеріали | Тираж (економічний) | Повтор | Запуск | Обмеження / SUB |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Цінники/ціннікові смуги | Мережі продуктів, аптеки, будмаркети | Друк VDP → ламінація (опц.) → гільйотина | Ricoh, Tauler, IDEAL | 160–300 g/m², синтетика (тест) | 50–5,000 арк. | Щотижня | Н | Синтетика «без гарантії якості» на Ricoh — тестувати |
| 2 | Шелфтокери/воблери | FMCG-дистриб'ютори, мережі | Друк → ламінація → фігурна порізка + біговка | Ricoh, Tauler, iECHO | 300–350 g/m², PP | 100–2,000 шт. | Щомісяця (промо) | С | Ніжка воблера (PET) — закупівля компонента |
| 3 | Тейбл-тенти, меню-тенти | HoReCa, банки, автосалони | Друк → ламінація → біговка/порізка | Ricoh, Tauler, iECHO або IDEAL + біг | 300–350 g/m² | 20–1,000 | Щоквартально | Н | — |
| 4 | Меню (листові, ламіновані, брошура) | Ресторани, кав'ярні, готелі | Друк → ламінація/брошурування | Ricoh, Tauler, DBM-350, IDEAL | 170–350 g/m² | 10–500 | 2–4 р/рік | Н | — |
| 5 | Етикетки на листах (kiss-cut) | Крафт-харчові, кав'ярні, косметика, мед | Друк → (ламінація) → kiss-cut | Ricoh, Vulcan / iECHO | Самоклейний папір/плівка ≤350 g/m² | 10–1,000 арк. | Щомісяця | Н–С | Label paper вимагає LCIT для гарантованої якості [V Ricoh AU]; для автоматичних етикетувальників потрібні рулони — SUB |
| 6 | Стікери/стікерпаки (листові) | Бренди, e-commerce, івенти | Друк → kiss-cut | Ricoh + Vulcan | Самоклейні | 50–2,000 арк. | Сезонно | Н | — |
| 7 | Наклейки/декалі з рулону (УФ) | Авто-сервіси, виробники обладнання, рітейл | УФ-друк → контурна порізка ARMS → ручне вибирання | Mimaki, Graphtec | ПВХ-плівка, PET | 50–3,000 шт. | Щоквартально | С | Без ламінації; висока абразія — SUB ламінація |
| 8 | Маркувальні/безпекові знаки, інвентарні таблички | Промисловість, склади, логістика, будівництво | УФ-друк на плівці або порізка світловідбивної плівки → монтаж на PVC/композит ≤6 мм → порізка | Mimaki/Graphtec, iECHO | Плівки, світловідбивні, PVC 1–5 мм | 10–1,000 | Щоквартально | С | Відповідність ДСТУ ISO 7010 — перевірка вимог; не перевірено |
| 9 | Вітринна графіка (перфоплівка, прозора з білим, матові/sandblast-імітація) | Рітейл, банки, клініки, ТРЦ | УФ-друк (W під/над) → порізка | Mimaki (+Graphtec) | Перфоплівка, прозора ПВХ, матова плівка | 1–100 м² | 4–8 р/рік | С | Монтаж — власна бригада або SUB |
| 10 | Інтер'єрні плівки, шпалери, фотопанно | Офіси, HoReCa, медклініки, девелопери | УФ-друк | Mimaki | Шпалери, ПВХ-плівка | 5–200 м² | Проєктно | С | Сертифікати пожежобезпеки шпалер — залежить від носія |
| 11 | Backlit-плівки/постери для лайтбоксів | Рітейл, HoReCa, аптеки, ТРЦ | УФ-друк (опц. білий подклад) | Mimaki | Backlit-плівка/папір ≤1 мм | 1–50 шт. | Сезонно | Н–С | — |
| 12 | Банери (ламіновані/литі) | Девелопери, івенти, рітейл | УФ-друк → люверсування/проклейка (ручне) | Mimaki | Банерна ПВХ ≤1 мм | 1–300 м² | Проєктно | Н | Немає зварювального апарата — ручна проклейка або SUB |
| 13 | Таблички/вивіски на foamboard/PVC/KT | Офіси, клініки, освіта, рітейл | УФ-друк на плівці → накатка (ручна) → порізка | Mimaki, iECHO | Foamboard/PVC 3–5 мм | 1–200 | Проєктно | С | Ручна накатка без ламінатора — якість; прямий друк на жорсткому неможливий (немає flatbed) |
| 14 | Магніти (рекламні, на авто — тонкі) | Служби доставки, таксі, клініки, страхові | Друк на магнітному вінілі/плівці → накатка → порізка | Mimaki/Ricoh, iECHO | Магнітний вініл, магнітні наклейки | 50–2,000 | Щорічно | С | Ricoh на магнітному — «без гарантії якості» [V]; товщина магніту для Graphtec не перевірена |
| 15 | Коробки малих тиражів (складні коробки, tuck-end, «самозбірні») | Косметика, кондитерські, мед, e-commerce, корпоративні подарунки | Друк → ламінація/фольга → порізка + біговка | Ricoh, Tauler, iECHO | Картон 300–400 g/m² (тест 470 з LCIT) | 10–500 коробок | Щоквартально | С–В | Розмір розгортки ≤ SRA3 (≈330×488) → дрібні коробки; >1–2 тис. — SUB висічка/офсет |
| 16 | Прототипи упаковки та POS-дисплеїв | Агенції, бренд-менеджери, виробники | Друк → порізка/біговка (картон, гофро E/B) | Ricoh/Mimaki, iECHO | Картон, гофро ≤6 мм | 1–10 | Проєктно | С | Гофро — тільки фігурна порізка без друку на гофрі (немає flatbed) |
| 17 | Слівери (обгортки), бандеролі, вкладиші/інструкції в упаковку | Харчові, косметика, фарма-SMB | Друк → (фольга) → порізка/біговка | Ricoh, Tauler, iECHO/IDEAL | 170–350 g/m² | 100–3,000 | Щомісяця | Н | — |
| 18 | Бірки (hang tags) | Одяг, взуття, ремісничі бренди | Друк → фольга/ламінат → порізка + отвір (iECHO) | Ricoh, Tauler, iECHO | 350–470 g/m² | 100–3,000 | Щосезону | Н–С | 470 g/m² — лише з LCIT |
| 19 | Брошури на скобі, каталоги ≤80 стор. | Виробники, дистриб'ютори, фарма, освіта | Друк → підбір → скоба/фальц → обріз | Ricoh/Riso, DSC, DBM-350/350T, IDEAL | 90–157 g/m² блок, 250–300 обкладинка | 50–3,000 | Щоквартально/щорічно | Н | >80 стор. — термоклей (мало) або SUB PUR; >5–10 тис. — SUB офсет |
| 20 | Інструкції/паспорти виробів (1-кол.) | Виробники техніки, меблів, обладнання | Riso → DSC → DBM або фальц (ручний) | Riso, DSC, DBM-350 | 60–90 g/m² | 500–20,000 | Щомісяця | Н | Фальцювальна машина в переліку відсутня |
| 21 | Бланки, анкети, навчальні зошити | Освіта, медицина, держсектор | Riso → IDEAL / DSC+DBM | Riso, DSC, DBM, IDEAL | 60–90 g/m² | 500–50,000 | Щомісяця | Н | Самокопіювальні набори — Ricoh підтримує carbonless [V]; нумерація — VDP на Ricoh |
| 22 | Корпоративні звіти, презентаційні книги (термоклей) | Корпорації, консалтинг, ВНЗ | Ricoh → термоклей → IDEAL | Ricoh, binder, IDEAL | 90–120 g/m² + обкладинка | 1–50 | Щорічно | Н | Ручне; не для крейдованого великого тиражу |
| 23 | Брендовані блокноти/планери (скоба або термоклей) | Корпорації (HR, welcome-kit), банки, фарма | Друк → підбір → скоба/клей → обріз | Ricoh/Riso, DSC, DBM / binder, IDEAL | 80 g/m² блок, 300 g/m² обкладинка | 50–1,000 | Щорічно (Q4) | Н–С | Тверда обкладинка, спіраль — SUB (не в переліку) |
| 24 | Сертифікати, дипломи, запрошення з фольгою/невидимим червоним | Освіта, тренінгові компанії, івенти, HR | Ricoh (5-й колір опц.) → фольга Tauler → IDEAL | Ricoh, Tauler, IDEAL | 250–350 g/m², дизайнерські | 10–1,000 | Сезонно | Н | Invisible red — тільки якщо є 5-й колір |
| 25 | Візитки преміум (ламінація, фольга) | Усі B2B | Ricoh → Tauler → IDEAL | Ricoh, Tauler, IDEAL | 350–470 g/m² | 100–2,000 | Постійно (низький чек) | Н | Висока конкуренція онлайн-друкарень |
| 26 | Бейджі, івент-набори (програмки, бейджі, тейбл-тенти, банери) | Конференції, виставки, івент-агенції | Ricoh VDP → порізка; Mimaki банери/прес-воли | Ricoh, IDEAL/iECHO, Mimaki, DBM | Картон, PP, банер | 50–2,000 комплектів | Проєктно | С | Стійки press-wall/roll-up — SUB |
| 27 | Конверти брендовані (готові конверти) | Банки, юристи, держсектор | Друк на готових конвертах | Ricoh | Конверти | 100–5,000 | Щоквартально | Н | Конверти — з bypass/LCIT [V Ricoh AU] |
| 28 | Directmail / персоналізовані листівки VDP | Банки, страхові, медцентри, девелопери | VDP → порізка → (фальц) | Ricoh, IDEAL | 170–350 g/m² | 500–10,000 | Кампанійно | С | Фальцювання вручну/біговка |

**Products needing subcontractors or hardware (flag SUB):**

| Продукт | Що робимо самі | Що SUB / чого бракує | Примітка |
|---|---|---|---|
| Roll-up / X-банер / прес-вол | Друк полотна на Mimaki (банер/PET ≤1 мм) | Механізм/стійки | Технічно ОК, маржа на друці; механізм — закупівля |
| Підлогова графіка | УФ-друк на плівці | Сертифікований антислип-ламінат R10/R11 (DIN 51130) + широкий ламінатор | Без ламінату — продавати не можна (безпека) [V Neschen/Hexis] |
| Брендування авто литою плівкою (full wrap) | Друк на литій плівці (технічно) | Ламінат для wrap + немає сертифікації ink+film | Wrap — не рекомендується без тесту/гарантії; часткове брендування (плоскі поверхні, плотерна порізка однотонних плівок на Graphtec) — ОК |
| Рулонні етикетки великими тиражами (5–100 тис.) | Прототип/малий тираж на Mimaki+Graphtec або Ricoh+Vulcan | Рулонний цифровий/флексо прес, слітер, перемотка | SUB |
| Друк на жорстких листах (PVC, композит, скло) | Монтаж надрукованої плівки + порізка на iECHO | УФ-планшет | SUB або «плівка + накатка» |
| Коробки/POS тиражем >1–2 тис., гофрокороби з друком | Прототип/пілот | Офсет + висічний прес / флексо по гофро | SUB |
| Тверда палітурка, спіраль, PUR-клей, конгрев (тиснення) | — | Відповідне обладнання | SUB |
| Брошури >80 стор. / >10 тис. прим. | — | Офсет + КБС | SUB |
| Ламінація широкоформатних УФ-відбитків | — | Рулонний холодний ламінатор 1.6 м | Capex або SUB (важлива «вузька ланка») |

---

## KQ6. Технічно можливо, але економічно недоцільно

### Takeaway
Explicitly flag the following as "possible but not sensible":
- long runs on the iECHO and Riso-colour work
- roll labels in thousands via Graphtec weeding
- booklets above ~3–5k on digital
- perfect binding above ~50–100 copies on an office binder
- banner-sheet POS on the Ricoh for large quantities
- unlaminated UV floor/vehicle work

### Cited Findings
- [D] iECHO PK positioning: "sample making and short-run customized production". The feeder holds about 400 sheets (250 g). — [Fujifilm NZ](https://www.fujifilm.com/fbnz/en/products/graphic/wide-format/iecho-pk0604-and-pk0705)
- [V] DBM-350 max 20 sheets 81.4 gsm; DBM-350T fore-edge trim only. — [Duplo](https://www.duplousa.com/wp-content/uploads/2022/01/350-Booklet-System_0122.pdf)
- [V] Banner-sheet weight drops to 52–300 gsm above 19.2" length; the oversize tray is optional. — [Ricoh spec](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)
- [D] Mimaki UJV100 printing with white/clear runs at half the 4C speed. — [CMYUK (via search)](https://www.cmyuk.com/uploads/Mimaki-UJV100-160-plus.pdf)
- [V] Floor graphics must use certified anti-slip laminate. — [Neschen](https://www.neschen.de/en/floor-graphics-folien-die-10-haeufigsten-fragen/)

### Inferences
All items are [A]:
- **Folding cartons > ~1,000–2,000 pcs on the iECHO.** Cut-and-crease time per sheet makes die-cutting (steel-rule die on a platen) cheaper beyond the low thousands. The exact crossover is unverified and depends on shop rates.
- **Colour work on the Riso** (multi-drum passes with registration drift). The Ricoh is better for any CMYK. Riso is only sensible for 1–2 spot-colour volume.
- **Roll labels in the thousands on Mimaki+Graphtec.** Manual weeding, no slitting/rewinding, and no lamination make it uncompetitive against label printers.
- **Saddle-stitched booklets > ~3–5k copies** (offset cheaper). Toner booklets with heavy coverage also carry click costs per page.
- **Perfect-bound > ~50–100 copies on the office binder.** It is manual and has weak adhesion on coated stock.
- **5th-colour white/gold on the Ricoh for long runs.** Special toner yields are about 19–22.5K prints/bottle at 15% coverage vs 67K for CMYK, so special toner costs per sheet are materially higher (yields from the [Ricoh spec](https://meters.kelleycreate.com/wp-content/uploads/2024/01/SPECS-ricoh-pro-C7500.pdf)). Price white/gold as premium.
- **Full vehicle wraps with UV ink** without wrap-certified ink/film/laminate. This is a warranty and liability risk. Restrict to flat-panel decals and cut-vinyl lettering.
- **Large rigid signs** made as plastic + mounted UV film + manual application (no laminator). Quality and labour issues; above about 10–20 signs, outsource to a flatbed UV shop.
- **Foil on many SKUs with small coverage.** The foil cost is per-roll width, not per-image, so waste foil is high in small, scattered elements (industry knowledge, not verified for Tauler).

### Gaps
- No Ukrainian 2026 price data for substrates, clicks, subcontract die-cutting or offset was collected in this thread, so break-even points remain hypotheses.
- Actual machine hourly rates, Ricoh click contract terms and machine utilisation at Dniprograf are unknown.
- The iECHO cycle time per sheet for typical cartons was not found in any official or test source.
- No source verified whether the shop's Graphtec can reliably cut 0.4–0.8 mm magnetic sheeting at 600 gf.
