const SCENARIO_CONFIGS = {
  SCENARIO_1: {
    roomModel: "#room-a-glb", // Original room
    roomPos: "0 0 0",

    // spawnPos: { x: 0, y: 0, z: 0 },
    // spawnRot: "0 0 0",
    spawnRot: "0 -90 0",

    uiWrapperPos: "-0.5 0 -1.3",
    uiWrapperRot: "0 0 0",

    scenarioPanelPos: "1.574 1.6 3.2",
    scenarioPanelRot: "0 180 0",
    scenarioPanelTitlePos: "0 0.7 0.02",
    panelScenarioPos: "0 0.4 0.02",

    mainDashboardPos: "2.9 1.4 2.5",
    mainDashboardRot: "0 -120 0",
    mainDashboardData: {
      s: "Dhr. Yassin El Amrani, 50 jaar, ligt 2 dagen opgenomen op de afdeling Longgeneeskunde. Hij heeft sinds 4 dagen last van toenemende benauwdheidsklachten, koorts, kortademigheid en hoesten met slijm.",
      b: "Huidige diagnose: pneumonie. Voorgeschiedenis: Diabetes Mellitus type 2, Astma, hypertensie. Relevant: Dhr. is bekend met 17 pakjaren.",
      a: "AF: 23/min | Stridor aanwezig | Sat: 87% (kamerlucht) | Temp: 38,6 graden | Productieve hoest met geel sputum | Status: Vermoeid en benauwd bij inspanning.",
      r: "Beleid: Start AB en slijmverdunner. Zo nodig O2. NEWS 3x dd meten. Stimuleren van hoesten. Fysio in consult voor ademhalingsoefeningen.",
      meds: {
        names:
          "Paracetamol\nAmlodipine\nMorfine\nSalbutamol\nMetformine\nAmoxicilline\nAcetylcysteïne",
        dosages: "1000 mg\n5 mg\n10 mg\n100 mcg/puf\n500 mg\n500 mg\n600 mg",
        freqs:
          "4x dd ZN\n1x dd\nZN bij pijn\n4x dd (2 pufs)\n1x dd (ontbijt)\n3x dd\n1x dd",
      },
    },

    patientPos: "1.229 -1.7 4.175",
    patientRot: "-7.520 180 -4",
    patientScale: "0.015 0.015 0.015",
    patientCough: true,

    medCartPos: "0.664 0.445 -0.774",
    medCartRot: "0 22 0",
    medCartWidth: "0.7",
    medCartDepth: "0.52",
    medCartHeight: "1.08",

    features: ["MED_CUP", "BOTTLES", "SENSOR"],

    questionPool: [
      {
        id: "ACETYLCYSTEINE",
        type: "PHYSICAL",
        physicalType: "PLACE_CUP",
        generate() {
          const mg = [400, 600, 800][Math.floor(Math.random() * 3)];
          const dagen = Math.floor(Math.random() * 5) + 3;
          const dagKeer = Math.floor(Math.random() * 2) + 4;
          const result = mg * dagKeer * dagen;

          return {
            patient: `Dhr. El Amrani krijgt vanwege het taaie slijm bij zijn longontsteking Acetylcysteine [tablet dispergeerbaar] ${mg} mg ${dagKeer} keer per dag voorgeschreven.`,
            // Phase 1: Instruction only
            task: `Voorbereiding: pak de Acetylcysteine van de kar en zet deze op de tafel van de patiënt.`,
            // Phase 2: The math question revealed after placement
            mathTask: `Hoeveel mg van dit medicijn krijgt dhr. El Amrani in ${dagen} dagen?`,
            answer: result,
            unit: "mg",
            precision: 0,
            rationale: `${mg} mg x ${dagKeer} keer x ${dagen} dagen = ${result} mg.`,
          };
        },
      },
      {
        id: "AMOXICILLINE",
        type: "STANDARD",
        generate() {
          const mgOptions = [250, 500, 750];
          const mg = mgOptions[Math.floor(Math.random() * mgOptions.length)];
          const perDag = [2, 3][Math.floor(Math.random() * 2)];
          const dagen = Math.floor(Math.random() * 4) + 3;
          const resultGrams = (mg * perDag * dagen) / 1000;

          return {
            patient: `Vanwege de bacteriële infectie krijgt dhr. El Amrani Amoxicilline [tablet] ${mg} mg, ${perDag} keer per dag.`,
            task: `Hoeveel gram van dit medicijn krijgt dhr. El Amrani in ${dagen} dagen?`,
            answer: parseFloat(resultGrams.toFixed(2)),
            unit: "gram",
            precision: 2,
            rationale: `(${mg} mg x ${perDag} x ${dagen}) / 1000 = ${resultGrams.toFixed(2)} gram.`,
          };
        },
      },
      {
        id: "PETHIDINE",
        type: "STANDARD",
        generate() {
          const pct = [1, 5, 10][Math.floor(Math.random() * 3)];
          const ml = [1, 2, 5][Math.floor(Math.random() * 3)];
          const mgPerMl = pct * 10;
          const result = mgPerMl * ml;
          return {
            patient: `Tijdens de opname heeft dhr. El Amrani veel pijn door het hevige hoesten. De arts schrijft eenmalig Pethidine-oplossing ${pct}% intramusculair voor.`,
            task: `De verpleegkundige dient ${ml} ml toe. Hoeveel mg Pethidine heeft dhr. El Amrani gekregen? Geef een geheel getal.`,
            answer: result,
            unit: "mg",
            precision: 0,
            rationale: `Rekenregel: 1% = 10 mg/ml. ${pct}% = ${mgPerMl} mg/ml. ${ml} ml x ${mgPerMl} mg = ${result} mg.`,
          };
        },
      },
      {
        id: "MORFINE",
        type: "PHYSICAL",
        physicalType: "INJECTION",
        generate() {
          const concentrations = [1, 2, 5]; // Changed 4 to 5 to match your bottles
          const pickedPct = concentrations[Math.floor(Math.random() * 3)];
          const mgVoorschrift = [5, 10, 15][Math.floor(Math.random() * 3)];

          const mgPerMl = pickedPct * 10;
          const resultMl = mgVoorschrift / mgPerMl;

          return {
            patient: `Dhr. El Amrani heeft hevige pijn. De arts schrijft ${mgVoorschrift} mg Morfine voor als injectie.`,
            // Phase 1: The instruction
            task: `Zoek de flacon van ${pickedPct}% op de medicijnwagen en plaats deze op de tafel.`,
            // Phase 2: The math reveal
            mathTask: `De flacon van ${pickedPct}% staat klaar. Hoeveel ml moet je opzuigen voor een dosis van ${mgVoorschrift} mg?`,
            requiredPct: pickedPct,
            answer: parseFloat(resultMl.toFixed(1)),
            unit: "ml",
            rationale: `${pickedPct}% = ${mgPerMl} mg/ml. Voor ${mgVoorschrift} mg heb je ${mgVoorschrift} / ${mgPerMl} = ${resultMl.toFixed(1)} ml nodig.`,
          };
        },
      },
      {
        id: "SLIJMOPLOSSING",
        type: "STANDARD",
        generate() {
          const v1 = [10, 20][Math.floor(Math.random() * 2)];
          const c1 = 25;
          const c2 = 5;
          const totalV2 = (c1 * v1) / c2;
          const waterToAdd = totalV2 - v1;

          return {
            patient: `Dhr. El Amrani krijgt een inhalatie. Er is ${v1} ml van een ${c1}% slijmoplossing beschikbaar op de kar.`,
            task: `De arts schrijft een concentratie van ${c2}% voor. \n\nHoeveel ml water moet je toevoegen om deze sterkte te bereiken? Rond af op 1 decimaal.`,
            answer: waterToAdd,
            unit: "ml",
            precision: 0,
            rationale: `V2 = (${c1}% x ${v1}ml) / ${c2}% = ${totalV2}ml. Toevoegen: ${totalV2} - ${v1} = ${waterToAdd}ml water.`,
          };
        },
      },
      {
        id: "DESINFECTIE",
        type: "STANDARD",
        generate() {
          const liters = [1, 2, 3][Math.floor(Math.random() * 3)];
          const targetPct = [2, 4, 6][Math.floor(Math.random() * 3)];
          const stockPct = 12;
          const v2_ml = liters * 1000;
          const result = Math.round((targetPct * v2_ml) / stockPct);
          return {
            patient: `Op de afdeling wordt een desinfecterende oplossing gemaakt om de zuurstofapparatuur van dhr. El Amrani schoon te maken. Op voorraad is een oplossing met ${stockPct}% actieve stof.`,
            task: `Nodig is ${liters} liter van een ${targetPct}% oplossing. Hoeveel ml van de voorraadoplossing moet worden gebruikt? Geef een geheel getal.`,
            answer: result,
            unit: "ml",
            precision: 0,
            rationale: `C1 x V1 = C2 x V2 -> (${stockPct} x V1) = (${targetPct} x ${v2_ml}). V1 = ${result} ml.`,
          };
        },
      },
    ],
  },

  SCENARIO_2: {
    roomModel: "#room-b-glb",
    roomPos: "-2.8 -0.17 10.6",

    spawnPos: "1.6 0 -0.8",
    spawnRot: "0 -90 0",

    uiWrapperPos: "1.3 0 0.6",
    uiWrapperRot: "0 90 0",

    scenarioPanelPos: "1.5 1.8 2.4",
    scenarioPanelRot: "0 -160 0",
    scenarioPanelTitlePos: "0 1.6 0.02",
    panelScenarioPos: "0 1.3 0.02",

    mainDashboardPos: "-0.4 1.4 0.4",
    mainDashboardRot: "0 110 0",
    mainDashboardData: {
      s: "Dhr. Emre Demir, 64 jaar, is sinds vanochtend opgenomen op de Intensive Care (IC) met ernstige benauwdheid en hevig hoesten.",
      b: "Huidige diagnose: ARDS. Voorgeschiedenis: chronisch hartfalen, chronische nierinsufficientie en hypercholesterolemie.",
      a: "AF: 29/min | Sat: 85% (kamerlucht) | Productieve hoest | Vermoeidheid | Zuurstof: 6L/min via masker.",
      r: "Beleid: Monitoring IC, Zuurstoftherapie, Medicatie via infuus, Ondersteuning van de ademhaling.",
      meds: {
        names:
          "Paracetamol\nZuurstof\nFurosemide (inf)\nNoradrenaline\nSalbutamol",
        dosages: "1000 mg\n6 L/min\n40 mg\n6 mg / 50ml\n2 puffs",
        freqs: "4x dd\nContinu\n2x dd\n1-2x dd ZN\n4x dd",
      },
    },

    patientPos: "6.835 -1.676 -1.032",
    patientRot: "-7.520 -90 -4",
    patientScale: "0.015 0.015 0.015",
    patientCough: true,

    ivPolePos: "0.4 0 2.1",
    ivPoleRot: "0 -45 0",
    ivPumpScreenPos: "0 1.45 -0.2",
    ivPumpScreenRot: "0 180 0",

    medCartPos: "-1.2 0.445 0.5",
    medCartRot: "0 22 0",
    medCartWidth: "0.7",
    medCartDepth: "0.52",
    medCartHeight: "1.08",

    features: ["IV_PUMP"],

    questionPool: [
      {
        id: "ZUURSTOF_DRUK",
        type: "STANDARD",
        generate() {
          const inhoudCilinder = [2, 5, 10][Math.floor(Math.random() * 3)];
          const startBar = [100, 150, 200][Math.floor(Math.random() * 3)];
          const verbruikLiters = [4, 6, 8][Math.floor(Math.random() * 3)];
          const uren = 1;

          const totaalLiters = inhoudCilinder * startBar;
          const verbruikt = verbruikLiters * 60;
          const over = totaalLiters - verbruikt;
          const resultBar = Math.round(over / inhoudCilinder);

          return {
            patient: `Dhr. Demir (ARDS) krijgt ${verbruikLiters} L/min zuurstof. Voor transport naar de CT gebruik je een zuurstofcilinder van ${inhoudCilinder} liter. De manometer staat op ${startBar} bar.`,
            task: `Hoeveel druk (bar) geeft de manometer aan na precies ${uren} uur transport? Geef een geheel getal.`,
            answer: resultBar,
            unit: "bar",
            precision: 0,
            rationale: `Totaal: ${inhoudCilinder}L x ${startBar}bar = ${totaalLiters}L. Verbruik: ${verbruikLiters}L x 60min = ${verbruikt}L. Over: ${totaalLiters} - ${verbruikt} = ${over}L. Druk: ${over} / ${inhoudCilinder} = ${resultBar} bar.`,
          };
        },
      },
      {
        id: "ZUURSTOF_TIJD",
        type: "STANDARD",
        generate() {
          const inhoudCilinder = [2, 5, 10][Math.floor(Math.random() * 3)];
          const bar = [80, 100, 120][Math.floor(Math.random() * 3)];
          const flow = [2, 4, 5][Math.floor(Math.random() * 3)];

          const totaalLiters = inhoudCilinder * bar;
          const minuten = Math.floor(totaalLiters / flow);

          return {
            patient: `Voor een transport wordt een zuurstofcilinder van ${inhoudCilinder} liter gebruikt. De manometer staat op ${bar} bar. Dhr. Demir heeft een voorschrift van ${flow} liter zuurstof per minuut.`,
            task: `Hoeveel hele minuten kan de patiënt maximaal met deze cilinder doen? Geef een geheel getal.`,
            answer: minuten,
            unit: "minuten",
            precision: 0,
            rationale: `Totaal zuurstof: ${inhoudCilinder}L x ${bar}bar = ${totaalLiters} liter. Beschikbare tijd: ${totaalLiters}L / ${flow}L/min = ${minuten} minuten.`,
          };
        },
      },
      {
        id: "FUROSEMIDE_DRUPPEL",
        type: "STANDARD",
        generate() {
          const mgVoorschrift = [20, 40, 60][Math.floor(Math.random() * 3)];
          const concentratie = 10; // 10mg/ml
          const mlNacl = 50;
          const tijdMin = [15, 20, 30][Math.floor(Math.random() * 3)];

          const mlMedicatie = mgVoorschrift / concentratie;
          const totaalVolume = mlNacl + mlMedicatie;
          const totaalDruppels = totaalVolume * 20;
          const druppelSnelheid = Math.round(totaalDruppels / tijdMin);

          return {
            patient: `Dhr. Demir krijgt Furosemide [infusie] vanwege hartfalen. Voorschrift: ${mgVoorschrift} mg. Beschikbaar: ampullen 10 mg/ml. Je voegt dit toe aan ${mlNacl} ml NaCl.`,
            task: `De oplossing moet in ${tijdMin} minuten inlopen. Op welke druppelsnelheid stel je het infuus in? (Rekenregel: 1ml = 20 druppels).`,
            answer: druppelSnelheid,
            unit: "druppels/min",
            precision: 0,
            rationale: `Medicatie: ${mgVoorschrift}mg / 10mg/ml = ${mlMedicatie}ml. Totaal volume: ${mlNacl} + ${mlMedicatie} = ${totaalVolume}ml. Druppels: ${totaalVolume} x 20 = ${totaalDruppels}. Snelheid: ${totaalDruppels} / ${tijdMin}min = ${druppelSnelheid} dr/min.`,
          };
        },
      },
      {
        id: "NORADRENALINE_MG",
        type: "STANDARD",
        generate() {
          const mgInZak = [4, 6, 8][Math.floor(Math.random() * 3)];
          const mlNacl = 50;
          const mlMedicatie = mgInZak; // want 1mg/ml
          const totaalVolume = mlNacl + mlMedicatie;
          const pompstand = [20, 25, 30][Math.floor(Math.random() * 3)];
          const uren = 1;

          const mgPerMl = mgInZak / totaalVolume;
          const totaalMg = parseFloat((pompstand * uren * mgPerMl).toFixed(2));

          return {
            patient: `Het infuuszakje bevat ${mgInZak} mg Noradrenaline in totaal ${totaalVolume} ml vloeistof. Het infuus is een uur geleden aangesloten op een stand van ${pompstand} ml/uur.`,
            task: `Hoeveel mg Noradrenaline heeft Dhr. Demir het afgelopen uur gekregen? Geef 2 decimalen.`,
            answer: totaalMg,
            unit: "mg",
            precision: 2,
            rationale: `Concentratie: ${mgInZak}mg / ${totaalVolume}ml = ${mgPerMl.toFixed(4)} mg/ml. In 1 uur is ${pompstand}ml gegeven. ${pompstand} x ${mgPerMl.toFixed(4)} = ${totaalMg} mg.`,
          };
        },
      },
      {
        id: "ONDANSETRON_POMP",
        type: "STANDARD",
        isPump: true,
        generate() {
          const mgVoorschrift = 4;
          const mlMedicatie = 2; // 2mg/ml dus 2ml nodig
          const mlNacl = 50;
          const minuten = [15, 20, 30][Math.floor(Math.random() * 3)];

          const totaalVolume = mlNacl + mlMedicatie;
          const uren = minuten / 60;
          const pompstand = Math.round(totaalVolume / uren);

          return {
            patient: `Voorschrift: Ondansetron ${mgVoorschrift} mg via een infuuspomp. Je voegt de medicatie (${mlMedicatie} ml) toe aan ${mlNacl} ml NaCl.`,
            task: `De oplossing moet in ${minuten} minuten inlopen. Op welke pompstand (ml/uur) stel je de spuitpomp in? Geef een geheel getal.`,
            answer: pompstand,
            unit: "ml/uur",
            precision: 0,
            rationale: `Totaal volume: ${mlNacl} + ${mlMedicatie} = ${totaalVolume} ml. Tijd in uren: ${minuten} / 60 = ${uren.toFixed(2)} uur. Stand: ${totaalVolume} / ${uren.toFixed(2)} = ${pompstand} ml/uur.`,
          };
        },
      },
    ],
  },
};
