import { NextResponse } from 'next/server';
import { getAirtableIngredients } from '../../utils/airtable';

export async function GET() {
  try {
    const ingredients = await getAirtableIngredients();
    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Erreur lors de la récupération des ingrédients:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ingrédients' },
      { status: 500 }
    );
  }
} 