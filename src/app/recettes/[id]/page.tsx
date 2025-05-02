import { getAirtableRecetteById } from '../../utils/airtable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface RecipePageProps {
  params: {
    id: string;
  };
}

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const recette = await getAirtableRecetteById(params.id);
  const fields = recette.fields;

  const ingredients = Array.isArray(fields.Ingrédients) ? fields.Ingrédients : [];
  const analyse = typeof fields['Analyse nutritionnelle'] === 'string' ? fields['Analyse nutritionnelle'] : '';
  const imageUrl = fields.Image || 'https://source.unsplash.com/800x400/?food';

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link href="/recettes" className="flex items-center text-blue-600 dark:text-blue-400 mb-4">
        <ArrowLeft className="h-5 w-5 mr-1" />
        Retour à la liste
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow p-6">
        <img
          src={imageUrl}
          alt={`Image de ${fields.Nom}`}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {fields.Nom}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Type de plat : {fields['Type de plat'] || 'Non renseigné'} | Pour {fields['Nombre de personnes'] || '?'} personne(s)
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {fields.Instructions || 'Pas d’instructions disponibles.'}
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Ingrédients</h2>
          {ingredients.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
              {ingredients.map((ingredient: string, index: number) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucun ingrédient renseigné.</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Analyse nutritionnelle</h2>
          <p className="text-gray-700 dark:text-gray-300">
            {analyse || 'Pas d’analyse nutritionnelle disponible.'}
          </p>
        </section>
      </div>
    </main>
  );
}
