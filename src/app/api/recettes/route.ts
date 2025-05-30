import { NextRequest, NextResponse } from 'next/server';
import { addAirtableRecette } from '../../utils/airtable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🔄 API Recettes - Données reçues:", JSON.stringify(body, null, 2));
    
    if (!body.fields || !body.fields.Nom) {
      console.error("❌ API Recettes - Nom de recette manquant");
      return NextResponse.json(
        { error: 'Le nom de la recette est requis' },
        { status: 400 }
      );
    }

    console.log("✅ API Recettes - Validation OK, appel à addAirtableRecette");
    const result = await addAirtableRecette(body);
    console.log("📊 API Recettes - Résultat de addAirtableRecette:", result);
    
    if (result.success) {
      console.log("✅ API Recettes - Succès, ID:", result.id);
      return NextResponse.json({ 
        success: true, 
        id: result.id,
        message: 'Recette ajoutée avec succès' 
      });
    } else {
      console.error("❌ API Recettes - Échec:", result.error);
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'ajout de la recette' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erreur dans l\'API recettes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'ajout de la recette' },
      { status: 500 }
    );
  }
} 