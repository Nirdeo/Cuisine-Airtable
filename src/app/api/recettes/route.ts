import { NextRequest, NextResponse } from 'next/server';
import { addAirtableRecette } from '../../utils/airtable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.fields || !body.fields.Nom) {
      return NextResponse.json(
        { error: 'Le nom de la recette est requis' },
        { status: 400 }
      );
    }

    const result = await addAirtableRecette(body);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        id: result.id,
        message: 'Recette ajoutée avec succès' 
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'ajout de la recette' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur dans l\'API recettes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'ajout de la recette' },
      { status: 500 }
    );
  }
} 