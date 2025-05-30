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

  if (Array.isArray(recette.fields.Ingrédients)) {
    const ingredientRecords = await Promise.all(
      recette.fields.Ingrédients.map((ingredientId: string) =>
        base('Ingrédients').find(ingredientId)
      )
    );
    ingredientNames = ingredientRecords.map((record) => record.fields.Nom as string);
  }

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

    if (recette.fields["Ingrédients générés IA"] && Array.isArray(recette.fields["Ingrédients générés IA"])) {
      console.log("Traitement des ingrédients générés par l'IA:", recette.fields["Ingrédients générés IA"]);
      
      const ingredientsResult = await processIngredientsFromAI(recette.fields["Ingrédients générés IA"]);
      
      if (ingredientsResult.success) {
        fields["Ingrédients"] = ingredientsResult.ingredientIds;
        fields["Ingrédients (texte)"] = recette.fields["Ingrédients générés IA"].join(", ");
        
        if (ingredientsResult.createdIngredients && ingredientsResult.createdIngredients.length > 0) {
          console.log("Nouveaux ingrédients créés:", ingredientsResult.createdIngredients);
        }
      }
    }

    if (!fields["Ingrédients"] && recette.fields.Ingrédients && Array.isArray(recette.fields.Ingrédients) && recette.fields.Ingrédients.length > 0) {
      fields["Ingrédients"] = recette.fields.Ingrédients;
    }

    if (recette.fields["Ingrédients (texte)"]) {
      fields["Ingrédients (texte)"] = recette.fields["Ingrédients (texte)"];
    }
    
    if (recette.fields["Analyse nutritionnelle (texte)"]) {
      fields["Analyse nutritionnelle (texte)"] = recette.fields["Analyse nutritionnelle (texte)"];
      
      // Créer automatiquement un enregistrement d'analyse nutritionnelle
      const analyseResult = await createAnalyseNutritionnelle(
        recette.fields["Analyse nutritionnelle (texte)"], 
        recette.fields.Nom
      );
      
      if (analyseResult.success && analyseResult.id) {
        fields["Analyse nutritionnelle"] = [analyseResult.id];
        console.log("Analyse nutritionnelle créée avec l'ID:", analyseResult.id);
      }
    }

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
    const calories = analyse.fields.Calories || 'N/A';
    const proteines = analyse.fields.Protéines || 'N/A';
    const glucides = analyse.fields.Glucides || 'N/A';
    const lipides = analyse.fields.Lipides || 'N/A';
    
    const nom = `${calories} kcal - P:${proteines}g G:${glucides}g L:${lipides}g`;
    
    return {
      id: analyse.id,
      fields: {
        ...analyse.fields,
        Nom: nom,
      },
    };
  });
}

export async function createAnalyseNutritionnelle(analyseText: string, recetteName: string = '') {
  try {
    const parseNutritionalValue = (text: string, keyword: string): number | null => {
      const regex = new RegExp(`${keyword}\\s*:?\\s*([\\d.,]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        const value = match[1].replace(',', '.');
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    const parseTextValue = (text: string, keyword: string): string => {
      const regex = new RegExp(`${keyword}\\s*:?\\s*([^,\\n]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    const calories = parseNutritionalValue(analyseText, 'calories?');
    const proteines = parseNutritionalValue(analyseText, 'protéines?');
    const glucides = parseNutritionalValue(analyseText, 'glucides?');
    const lipides = parseNutritionalValue(analyseText, 'lipides?');
    
    // Extraire vitamines et minéraux (texte libre)
    const vitamines = parseTextValue(analyseText, 'vitamines?');
    const mineraux = parseTextValue(analyseText, 'minéraux?');

    const fields: any = {
      ID: Date.now(),
    };
    
    if (calories !== null) fields.Calories = calories;
    if (proteines !== null) fields.Protéines = proteines;
    if (glucides !== null) fields.Glucides = glucides;
    if (lipides !== null) fields.Lipides = lipides;
    if (vitamines) fields.Vitamines = vitamines;
    if (mineraux) fields.Minéraux = mineraux;

    const nom = recetteName ? 
      `Analyse - ${recetteName}` : 
      `${calories || 'N/A'} kcal - P:${proteines || 'N/A'}g G:${glucides || 'N/A'}g L:${lipides || 'N/A'}g`;
    
    if (nom) fields.Nom = nom;

    console.log("Création d'analyse nutritionnelle avec les champs:", fields);

    const createdRecord = await base('Analyses').create([{ fields }]);
    
    return {
      success: true,
      id: createdRecord[0].id,
      fields: createdRecord[0].fields
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'analyse nutritionnelle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création de l'analyse nutritionnelle.",
    };
  }
}

export async function findOrCreateIngredient(nomIngredient: string) {
  try {
    const existingRecords = await base('Ingrédients').select({
      filterByFormula: `{Nom} = "${nomIngredient}"`
    }).all();

    if (existingRecords.length > 0) {
      console.log(`Ingrédient "${nomIngredient}" trouvé avec l'ID:`, existingRecords[0].id);
      return {
        success: true,
        id: existingRecords[0].id,
        created: false
      };
    }

    console.log(`Création du nouvel ingrédient: "${nomIngredient}"`);
    const newRecord = await base('Ingrédients').create([{
      fields: {
        Nom: nomIngredient,
        Quantité: 1,
        Unité: "unité"
      }
    }]);

    console.log(`Nouvel ingrédient "${nomIngredient}" créé avec l'ID:`, newRecord[0].id);
    return {
      success: true,
      id: newRecord[0].id,
      created: true
    };
  } catch (error) {
    console.error(`Erreur lors de la création/recherche de l'ingrédient "${nomIngredient}":`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la gestion de l'ingrédient."
    };
  }
}

export async function processIngredientsFromAI(ingredientNames: string[]) {
  try {
    const ingredientIds: string[] = [];
    const createdIngredients: string[] = [];

    for (const nomIngredient of ingredientNames) {
      const result = await findOrCreateIngredient(nomIngredient.trim());
      if (result.success && result.id) {
        ingredientIds.push(result.id);
        if (result.created) {
          createdIngredients.push(nomIngredient);
        }
      }
    }

    return {
      success: true,
      ingredientIds,
      createdIngredients
    };
  } catch (error) {
    console.error("Erreur lors du traitement des ingrédients:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du traitement des ingrédients."
    };
  }
}
