"use server";

import Airtable from "airtable";

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
  return records.map((recette) => ({
    id: recette.id,
    fields: recette.fields,
  }));
}

export async function getAirtableRecetteById(id: string) {
  const recette = await base('Recettes').find(id);

  let ingredientNames: string[] = [];

  if (Array.isArray(recette.fields.Ingrédients)) {
    const ingredientRecords = await Promise.all(
      recette.fields.Ingrédients.map((ingredientId: string) =>
        base('Ingrédients').find(ingredientId)
      )
    );
    ingredientNames = ingredientRecords.map((record) => record.fields.Nom);
  }

  return {
    ...recette,
    fields: {
      ...recette.fields,
      Ingrédients: ingredientNames,
      Image: recette.fields.Image || '',
    },
  };
}

export async function addAirtableRecette(recette: Recette) {
  try {
    const createdRecords = await base('Recettes').create([{
      "fields": {
        "Nom": recette.fields.Nom,
        "Type de plat": recette.fields["Type de plat"],
        "Nombre de personnes": recette.fields["Nombre de personnes"],
        "Instructions": recette.fields.Instructions,
        "Ingrédients": recette.fields.Ingrédients,
        "Analyse nutritionnelle": recette.fields["Analyse nutritionnelle"],
        "Intolérances": recette.fields.Intolérances,
        "Image": recette.fields.Image
      },
    }]);

    console.log("Recette ajoutée avec succès. ID:", createdRecords[0].id);
    return {
      success: true,
      id: createdRecords[0].id,
    };
  } catch (error) {
    console.error("Erreur lors de l'ajout de la recette :", error);
    return {
      success: false,
      error: "Erreur lors de l'ajout de la recette.",
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
  return records.map((analyse) => ({
    id: analyse.id,
    fields: analyse.fields,
  }));
}
