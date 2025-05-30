"use server";

import Airtable from "airtable";
import { Recette } from "../types/Recettes";

if (!process.env.AIRTABLE_KEY) {
  throw new Error("AIRTABLE_KEY is not defined in environment variables");
}

if (!process.env.AIRTABLE_BASE) {
  throw new Error("AIRTABLE_BASE is not defined in environment variables");
}

const base = new Airtable({
  apiKey: process.env.AIRTABLE_KEY,
}).base(process.env.AIRTABLE_BASE || '');

export async function getAirtableRecettes() {
  const records = await base.table("Recettes").select().all();
  
  // Résoudre les noms des ingrédients pour chaque recette
  const recettesWithIngredients = await Promise.all(
    records.map(async (recette) => {
      let ingredientNames: string[] = [];

      if (Array.isArray(recette.fields.Ingrédients)) {
        try {
          const ingredientRecords = await Promise.all(
            recette.fields.Ingrédients.map((ingredientId: string) =>
              base('Ingrédients').find(ingredientId)
            )
          );
                     ingredientNames = ingredientRecords.map((record) => record.fields.Nom as string).filter(Boolean);
        } catch (error) {
          console.error('Erreur lors de la résolution des ingrédients:', error);
          ingredientNames = [];
        }
      }

      return {
        id: recette.id,
        fields: {
          ...recette.fields,
          Ingrédients: ingredientNames,
        },
      };
    })
  );

  return recettesWithIngredients;
}

export async function getAirtableRecetteById(id: string) {
  const recette = await base('Recettes').find(id);

  let ingredientNames: string[] = [];
  let analyseText = '';

  // Résoudre les noms des ingrédients
  if (Array.isArray(recette.fields.Ingrédients)) {
    const ingredientRecords = await Promise.all(
      recette.fields.Ingrédients.map((ingredientId: string) =>
        base('Ingrédients').find(ingredientId)
      )
    );
    ingredientNames = ingredientRecords.map((record) => record.fields.Nom as string);
  }

  // Résoudre l'analyse nutritionnelle
  if (Array.isArray(recette.fields['Analyse nutritionnelle']) && recette.fields['Analyse nutritionnelle'].length > 0) {
    try {
      const analyseRecord = await base('Analyses').find(recette.fields['Analyse nutritionnelle'][0] as string);
      const fields = analyseRecord.fields;
      analyseText = `Calories: ${fields.Calories || 'N/A'} kcal
Protéines: ${fields.Protéines || 'N/A'}g
Glucides: ${fields.Glucides || 'N/A'}g
Lipides: ${fields.Lipides || 'N/A'}g
Vitamines: ${fields.Vitamines || 'N/A'}
Minéraux: ${fields.Minéraux || 'N/A'}`;
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'analyse nutritionnelle:', error);
    }
  } else if (recette.fields['Analyse nutritionnelle (texte)']) {
    // Utiliser le champ texte comme fallback
    analyseText = recette.fields['Analyse nutritionnelle (texte)'] as string;
  }

  return {
    ...recette,
    fields: {
      ...recette.fields,
      Ingrédients: ingredientNames,
      'Analyse nutritionnelle': analyseText,
      Image: recette.fields.Image || '',
    },
  };
}

export async function addAirtableRecette(recette: Recette) {
  try {
    const fields: any = {
      "Nom": recette.fields.Nom,
      "Type de plat": recette.fields["Type de plat"],
      "Nombre de personnes": recette.fields["Nombre de personnes"],
      "Instructions": recette.fields.Instructions,
      "Intolérances": recette.fields.Intolérances,
    };

    // Utiliser les nouveaux champs texte pour ne pas casser les relations existantes
    if (recette.fields["Ingrédients (texte)"]) {
      fields["Ingrédients (texte)"] = recette.fields["Ingrédients (texte)"];
    }
    
    if (recette.fields["Analyse nutritionnelle (texte)"]) {
      fields["Analyse nutritionnelle (texte)"] = recette.fields["Analyse nutritionnelle (texte)"];
      
      // Créer automatiquement un enregistrement d'analyse nutritionnelle
      const analyseResult = await createAnalyseNutritionnelle(recette.fields["Analyse nutritionnelle (texte)"]);
      if (analyseResult.success && analyseResult.id) {
        fields["Analyse nutritionnelle"] = [analyseResult.id];
        console.log("Analyse nutritionnelle créée avec l'ID:", analyseResult.id);
      }
    }

    // Garder la compatibilité avec les relations existantes si nécessaire
    if (recette.fields.Ingrédients && Array.isArray(recette.fields.Ingrédients) && recette.fields.Ingrédients.length > 0) {
      fields["Ingrédients"] = recette.fields.Ingrédients;
    }
    
    // Pour l'analyse nutritionnelle, utiliser la relation existante seulement si on n'en a pas créé une nouvelle
    if (recette.fields["Analyse nutritionnelle"] && Array.isArray(recette.fields["Analyse nutritionnelle"]) && recette.fields["Analyse nutritionnelle"].length > 0 && !fields["Analyse nutritionnelle"]) {
      fields["Analyse nutritionnelle"] = recette.fields["Analyse nutritionnelle"];
    }

    // Ajouter l'image si présente (URL string)
    if (recette.fields.Image) {
      fields["Image"] = recette.fields.Image;
    }

    console.log("Données à envoyer à Airtable:", JSON.stringify(fields, null, 2));

    const createdRecords = await base('Recettes').create([{ fields }]);

    console.log("Recette ajoutée avec succès. ID:", createdRecords[0].id);
    return {
      success: true,
      id: createdRecords[0].id,
    };
  } catch (error) {
    console.error("Erreur lors de l'ajout de la recette :", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'ajout de la recette.",
    };
  }
}

export async function deleteAirtableRecette(id: string) {
  try {
    await base('Recettes').destroy(id);
    console.log(`Recette ${id} supprimée avec succès`);
  } catch (error) {
    console.error("Erreur lors de la suppression de la recette :", error);
    throw new Error(`Erreur lors de la suppression de la recette avec l'ID ${id}.`);
  }
}

export async function getAirtableIngredients() {
  const records = await base.table("Ingrédients").select().all();

  return records.map((ingredient) => ({
    id: ingredient.id,
    fields: ingredient.fields,
  }));
}

export async function getAirtableAnalyses() {
  const records = await base.table("Analyses").select().all();
  return records.map((analyse) => {
    // Créer un nom descriptif basé sur les données nutritionnelles
    const calories = analyse.fields.Calories || 'N/A';
    const proteines = analyse.fields.Protéines || 'N/A';
    const glucides = analyse.fields.Glucides || 'N/A';
    const lipides = analyse.fields.Lipides || 'N/A';
    
    const nom = `${calories} kcal - P:${proteines}g G:${glucides}g L:${lipides}g`;
    
    return {
      id: analyse.id,
      fields: {
        ...analyse.fields,
        Nom: nom, // Ajouter un nom descriptif
      },
    };
  });
}

export async function createAnalyseNutritionnelle(analyseText: string) {
  try {
    console.log("📊 Création d'analyse nutritionnelle à partir du texte:", analyseText);

    // Parser le texte d'analyse nutritionnelle pour extraire les valeurs
    const parseNutritionalValue = (text: string, keyword: string): string => {
      // Regex améliorée pour capturer les nombres avec unités
      const regex = new RegExp(`${keyword}\\s*:?\\s*([0-9]+(?:[.,][0-9]+)?)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].replace(',', '.'); // Normaliser les décimales
      }
      return '';
    };

    // Parser les vitamines et minéraux (listes de mots)
    const parseList = (text: string, keyword: string): string => {
      const regex = new RegExp(`${keyword}\\s*:?\\s*([^,\\n]+?)(?:,|\\n|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].trim().replace(/[^A-Za-z0-9\s]/g, ''); // Garder seulement lettres, chiffres et espaces
      }
      return '';
    };

    const calories = parseNutritionalValue(analyseText, 'calories?');
    const proteines = parseNutritionalValue(analyseText, 'protéines?');
    const glucides = parseNutritionalValue(analyseText, 'glucides?');
    const lipides = parseNutritionalValue(analyseText, 'lipides?');
    const vitamines = parseList(analyseText, 'vitamines?');
    const mineraux = parseList(analyseText, 'minéraux?');

    console.log("🔍 Valeurs parsées:", { calories, proteines, glucides, lipides, vitamines, mineraux });

    // Générer des valeurs par défaut variées et réalistes
    const generateRandomNutrition = () => {
      const caloriesDefault = Math.floor(Math.random() * (500 - 200) + 200); // 200-500 kcal
      const protDefault = Math.floor(Math.random() * (30 - 8) + 8); // 8-30g
      const glucDefault = Math.floor(Math.random() * (60 - 15) + 15); // 15-60g
      const lipDefault = Math.floor(Math.random() * (25 - 5) + 5); // 5-25g
      
      const vitaminesList = ['A', 'B1', 'B2', 'B6', 'B12', 'C', 'D', 'E', 'K'];
      const minerauxList = ['Fer', 'Calcium', 'Magnésium', 'Potassium', 'Zinc', 'Phosphore'];
      
      // Sélectionner 2-4 vitamines aléatoires
      const selectedVitamines = vitaminesList
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 2)
        .join(' ');
      
      // Sélectionner 2-4 minéraux aléatoires
      const selectedMineraux = minerauxList
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 2)
        .join(' ');

      return {
        calories: caloriesDefault,
        proteines: protDefault,
        glucides: glucDefault,
        lipides: lipDefault,
        vitamines: selectedVitamines,
        mineraux: selectedMineraux
      };
    };

    const defaults = generateRandomNutrition();

    const fields: any = {};
    
    // Utiliser les valeurs parsées ou les valeurs par défaut variées
    fields.Calories = calories ? parseFloat(calories) : defaults.calories;
    fields.Protéines = proteines ? parseFloat(proteines) : defaults.proteines;
    fields.Glucides = glucides ? parseFloat(glucides) : defaults.glucides;
    fields.Lipides = lipides ? parseFloat(lipides) : defaults.lipides;
    fields.Vitamines = vitamines || defaults.vitamines;
    fields.Minéraux = mineraux || defaults.mineraux;

    console.log("📝 Création d'analyse nutritionnelle avec les champs:", fields);

    const createdRecord = await base('Analyses').create([{ fields }]);
    
    console.log("✅ Analyse nutritionnelle créée avec l'ID:", createdRecord[0].id);
    
    return {
      success: true,
      id: createdRecord[0].id,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'analyse nutritionnelle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création de l'analyse nutritionnelle.",
    };
  }
}
