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
    // Créer d'abord la recette avec les champs de base
    const baseFields: any = {
      "Nom": recette.fields.Nom,
      "Type de plat": recette.fields["Type de plat"],
      "Nombre de personnes": recette.fields["Nombre de personnes"],
      "Instructions": recette.fields.Instructions,
      "Intolérances": recette.fields.Intolérances,
    };

    // Ajouter l'image si présente
    if (recette.fields.Image) {
      baseFields["Image"] = recette.fields.Image;
    }

    console.log("Création de la recette avec les champs de base:", JSON.stringify(baseFields, null, 2));

    // Créer la recette d'abord pour obtenir son ID
    const createdRecords = await base('Recettes').create([{ fields: baseFields }]);
    const recetteId = createdRecords[0].id;
    
    console.log("Recette créée avec l'ID:", recetteId);

    const updateFields: any = {};

    if (recette.fields["Ingrédients générés IA"] && Array.isArray(recette.fields["Ingrédients générés IA"])) {
      console.log("Traitement des ingrédients générés par l'IA:", recette.fields["Ingrédients générés IA"]);
      
      const ingredientsResult = await processIngredientsFromAI(recette.fields["Ingrédients générés IA"], recetteId);
      
      if (ingredientsResult.success) {
        updateFields["Ingrédients"] = ingredientsResult.ingredientIds;
        
        if (ingredientsResult.createdIngredients && ingredientsResult.createdIngredients.length > 0) {
          console.log("Nouveaux ingrédients créés:", ingredientsResult.createdIngredients);
        }
      }
    }

    // Utiliser les ingrédients sélectionnés manuellement si pas d'ingrédients IA
    if (!updateFields["Ingrédients"] && recette.fields.Ingrédients && Array.isArray(recette.fields.Ingrédients) && recette.fields.Ingrédients.length > 0) {
      updateFields["Ingrédients"] = recette.fields.Ingrédients;
    }
    
    // Traiter l'analyse nutritionnelle
    if (recette.fields["Analyse nutritionnelle (texte)"]) {
      const analyseResult = await findOrCreateAnalyse(
        recette.fields["Analyse nutritionnelle (texte)"], 
        recette.fields.Nom,
        recetteId
      );
      
      if (analyseResult.success && analyseResult.id) {
        updateFields["Analyse nutritionnelle"] = [analyseResult.id];
        console.log("Analyse nutritionnelle créée/trouvée avec l'ID:", analyseResult.id);
      }
    }

    // Utiliser l'analyse nutritionnelle existante si pas de nouvelle analyse
    if (!updateFields["Analyse nutritionnelle"] && recette.fields["Analyse nutritionnelle"] && Array.isArray(recette.fields["Analyse nutritionnelle"]) && recette.fields["Analyse nutritionnelle"].length > 0) {
      updateFields["Analyse nutritionnelle"] = recette.fields["Analyse nutritionnelle"];
    }

    // Mettre à jour la recette avec les relations
    if (Object.keys(updateFields).length > 0) {
      console.log("Mise à jour de la recette avec les relations:", JSON.stringify(updateFields, null, 2));
      await base('Recettes').update(recetteId, updateFields);
    }

    console.log("Recette complètement sauvegardée avec l'ID:", recetteId);
    return {
      success: true,
      id: recetteId,
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

export async function findOrCreateAnalyse(analyseText: string, recetteName: string, recetteId?: string) {
  try {
    // Parser le texte d'analyse nutritionnelle pour extraire les valeurs
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
    const vitamines = parseTextValue(analyseText, 'vitamines?');
    const mineraux = parseTextValue(analyseText, 'minéraux?');

    // Chercher si une analyse similaire existe déjà
    const nomAnalyse = `Analyse - ${recetteName}`;
    const existingRecords = await base('Analyses').select({
      filterByFormula: `{Nom} = "${nomAnalyse}"`
    }).all();

    if (existingRecords.length > 0) {
      console.log(`Analyse "${nomAnalyse}" trouvée avec l'ID:`, existingRecords[0].id);
      
      // Si on a un recetteId, mettre à jour la liaison
      if (recetteId) {
        const currentRecettes = existingRecords[0].fields.Recettes || [];
        const recettesArray = Array.isArray(currentRecettes) ? currentRecettes : [currentRecettes];
        
        if (!recettesArray.includes(recetteId)) {
          await base('Analyses').update(existingRecords[0].id, {
            Recettes: [...recettesArray, recetteId]
          });
          console.log(`Liaison ajoutée entre l'analyse "${nomAnalyse}" et la recette ${recetteId}`);
        }
      }
      
      return {
        success: true,
        id: existingRecords[0].id,
        created: false
      };
    }

    // Créer une nouvelle analyse
    console.log(`Création de la nouvelle analyse: "${nomAnalyse}"`);
    const fields: any = {
      ID: Date.now(),
      Nom: nomAnalyse
    };
    
    // Ajouter les valeurs nutritionnelles
    if (calories !== null) fields.Calories = calories;
    if (proteines !== null) fields.Protéines = proteines;
    if (glucides !== null) fields.Glucides = glucides;
    if (lipides !== null) fields.Lipides = lipides;
    if (vitamines) fields.Vitamines = vitamines;
    if (mineraux) fields.Minéraux = mineraux;

    // Ajouter la liaison avec la recette si fournie
    if (recetteId) {
      fields.Recettes = [recetteId];
    }

    console.log("Création d'analyse nutritionnelle avec les champs:", fields);
    const createdRecord = await base('Analyses').create([{ fields }]);
    
    return {
      success: true,
      id: createdRecord[0].id,
      created: true
    };
  } catch (error) {
    console.error("Erreur lors de la création/recherche de l'analyse nutritionnelle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la gestion de l'analyse nutritionnelle."
    };
  }
}

export async function findOrCreateIngredient(nomIngredient: string, recetteId?: string) {
  try {
    // Chercher d'abord si l'ingrédient existe déjà
    const existingRecords = await base('Ingrédients').select({
      filterByFormula: `{Nom} = "${nomIngredient}"`
    }).all();

    if (existingRecords.length > 0) {
      console.log(`Ingrédient "${nomIngredient}" trouvé avec l'ID:`, existingRecords[0].id);
      
      // Si on a un recetteId et que l'ingrédient existe, mettre à jour la liaison
      if (recetteId) {
        const currentRecettes = existingRecords[0].fields.Recettes || [];
        const recettesArray = Array.isArray(currentRecettes) ? currentRecettes : [currentRecettes];
        
        // Ajouter la nouvelle recette si elle n'est pas déjà liée
        if (!recettesArray.includes(recetteId)) {
          await base('Ingrédients').update(existingRecords[0].id, {
            Recettes: [...recettesArray, recetteId]
          });
          console.log(`Liaison ajoutée entre l'ingrédient "${nomIngredient}" et la recette ${recetteId}`);
        }
      }
      
      return {
        success: true,
        id: existingRecords[0].id,
        created: false
      };
    }

    // Si l'ingrédient n'existe pas, le créer
    console.log(`Création du nouvel ingrédient: "${nomIngredient}"`);
    const fields: any = {
      Nom: nomIngredient,
      Quantité: 1,
      Unité: "unité"
    };
    
    // Ajouter la liaison avec la recette si fournie
    if (recetteId) {
      fields.Recettes = [recetteId];
    }
    
    const newRecord = await base('Ingrédients').create([{ fields }]);

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

export async function processIngredientsFromAI(ingredientNames: string[], recetteId?: string) {
  try {
    const ingredientIds: string[] = [];
    const createdIngredients: string[] = [];

    for (const nomIngredient of ingredientNames) {
      const result = await findOrCreateIngredient(nomIngredient.trim(), recetteId);
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
