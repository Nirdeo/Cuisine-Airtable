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
    console.log("=== DÉBUT AJOUT RECETTE ===");
    console.log("Données reçues:", JSON.stringify(recette, null, 2));
    
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
      console.log("Ajout du champ Ingrédients (texte):", recette.fields["Ingrédients (texte)"]);
    }
    
    if (recette.fields["Analyse nutritionnelle (texte)"]) {
      fields["Analyse nutritionnelle (texte)"] = recette.fields["Analyse nutritionnelle (texte)"];
      
      // Créer automatiquement un enregistrement d'analyse nutritionnelle
      const analyseResult = await findOrCreateAnalyse(
        recette.fields["Analyse nutritionnelle (texte)"], 
        recette.fields.Nom
      );
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
    console.error("❌ Erreur lors de l'ajout de la recette :", error);
    console.log("=== ÉCHEC AJOUT RECETTE ===");
    
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
    const parseNutritionalValue = (text: string, keyword: string): string => {
      const regex = new RegExp(`${keyword}\\s*:?\\s*([^,\\n]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].trim().replace(/[^\d.,]/g, ''); // Garder seulement les chiffres et points/virgules
      }
      return '';
    };

    const calories = parseNutritionalValue(analyseText, 'calories?');
    const proteines = parseNutritionalValue(analyseText, 'protéines?');
    const glucides = parseNutritionalValue(analyseText, 'glucides?');
    const lipides = parseNutritionalValue(analyseText, 'lipides?');
    const vitamines = parseTextValue(analyseText, 'vitamines?');
    const mineraux = parseTextValue(analyseText, 'minéraux?');

    const fields: any = {};
    
    // Ajouter seulement les champs qui ont des valeurs valides
    if (calories !== null && calories > 0) fields.Calories = calories;
    if (proteines !== null && proteines > 0) fields.Protéines = proteines;
    if (glucides !== null && glucides > 0) fields.Glucides = glucides;
    if (lipides !== null && lipides > 0) fields.Lipides = lipides;
    if (vitamines && vitamines.length > 0) fields.Vitamines = vitamines;
    if (mineraux && mineraux.length > 0) fields.Minéraux = mineraux;

    // Si aucune valeur n'a été trouvée, utiliser des valeurs par défaut
    if (Object.keys(fields).length === 0) {
      console.log("Aucune valeur nutritionnelle trouvée, utilisation de valeurs par défaut");
      fields.Calories = 200;
      fields.Protéines = 10;
      fields.Glucides = 25;
      fields.Lipides = 5;
      fields.Vitamines = "A, C";
      fields.Minéraux = "Fer";
    }

    if (!fields.Calories && !fields.Protéines && !fields.Glucides && !fields.Lipides) {
      console.log("⚠️ Aucune valeur nutritionnelle numérique trouvée, utilisation de valeurs par défaut");
      fields.Calories = 200;
      fields.Protéines = 10;
      fields.Glucides = 25;
      fields.Lipides = 5;
      fields.Vitamines = analyseText;
      fields.Minéraux = "Information basée sur l'analyse IA";
    }

    if (recetteId) {
      fields.Recettes = [recetteId];
      console.log(`🔗 Liaison directe avec la recette ${recetteId} lors de la création`);
    }

    console.log("📝 Champs pour la création de l'analyse nutritionnelle:", fields);
    const createdRecord = await base('Analyses').create([{ fields }]);
    
    console.log("Analyse nutritionnelle créée avec l'ID:", createdRecord[0].id);
    return {
      success: true,
      id: createdRecord[0].id,
      created: true
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création/recherche de l'analyse nutritionnelle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la gestion de l'analyse nutritionnelle."
    };
  }
}

export async function findOrCreateIngredient(nomIngredient: string, recetteId?: string) {
  try {
    console.log(`🔍 Recherche/création de l'ingrédient: "${nomIngredient}" pour la recette: ${recetteId}`);
    
    // Chercher d'abord si l'ingrédient existe déjà
    const existingRecords = await base('Ingrédients').select({
      filterByFormula: `{Nom} = "${nomIngredient}"`
    }).all();

    if (existingRecords.length > 0) {
      console.log(`✅ Ingrédient "${nomIngredient}" trouvé avec l'ID:`, existingRecords[0].id);
      
      if (recetteId) {
        console.log(`🔄 Mise à jour de la liaison pour l'ingrédient "${nomIngredient}"`);
        const currentRecettes = existingRecords[0].fields.Recettes || [];
        const recettesArray = Array.isArray(currentRecettes) ? currentRecettes : [currentRecettes];
        
        if (!recettesArray.includes(recetteId)) {
          try {
            console.log(`📝 Mise à jour liaison ingrédient - Recettes actuelles:`, recettesArray);
            console.log(`📝 Ajout de la recette:`, recetteId);
            await base('Ingrédients').update(existingRecords[0].id, {
              Recettes: [...recettesArray, recetteId]
            });
            console.log(`✅ Liaison ajoutée entre l'ingrédient "${nomIngredient}" et la recette ${recetteId}`);
          } catch (updateError) {
            console.error(`❌ Erreur lors de la mise à jour de la liaison pour "${nomIngredient}":`, updateError);
          }
        } else {
          console.log(`ℹ️ L'ingrédient "${nomIngredient}" est déjà lié à la recette ${recetteId}`);
        }
      }
      
      return {
        success: true,
        id: existingRecords[0].id,
        created: false
      };
    }

    // Si l'ingrédient n'existe pas, le créer
    console.log(`🆕 Création du nouvel ingrédient: "${nomIngredient}"`);
    const fields: any = {
      Nom: nomIngredient,
      Quantité: 1,
      Unité: "unité"
    };
    
    if (recetteId) {
      fields.Recettes = [recetteId];
      console.log(`🔗 Liaison directe avec la recette ${recetteId} lors de la création`);
    }
    
    console.log(`📝 Champs pour la création de l'ingrédient:`, fields);
    const newRecord = await base('Ingrédients').create([{ fields }]);

    console.log(`✅ Nouvel ingrédient "${nomIngredient}" créé avec l'ID:`, newRecord[0].id);
    return {
      success: true,
      id: newRecord[0].id,
      created: true
    };
  } catch (error) {
    console.error(`❌ Erreur lors de la création/recherche de l'ingrédient "${nomIngredient}":`, error);
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

// Fonction de compatibilité pour createAnalyseNutritionnelle
export async function createAnalyseNutritionnelle(analyseText: string) {
  return await findOrCreateAnalyse(analyseText, "Analyse générée");
}
