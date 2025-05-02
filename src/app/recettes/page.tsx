import { getAirtableRecettes } from '../utils/airtable';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RecettesPage() {
  const recettes = await getAirtableRecettes();

  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-2 text-foreground">🍽️ Recettes Gourmandes</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Découvrez nos meilleures recettes, analysées nutritionnellement pour vous.
        </p>

        <div className="mt-6">
          <Link href="/recettes/add">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Ajouter une nouvelle recette
            </button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {recettes.map((recette) => (
          <Link
            key={recette.id}
            href={`/recettes/${recette.id}`}
            aria-label={`Voir les détails de la recette ${recette.fields.Nom}`}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition p-4 flex flex-col">
              <img
                src={recette.fields.Image || 'https://source.unsplash.com/400x300/?food'}
                alt={recette.fields.Nom}
                className="rounded-xl h-48 w-full object-cover mb-4"
              />
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {recette.fields.Nom}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Type : {recette.fields['Type de plat'] || 'Non renseigné'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Pour {recette.fields['Nombre de personnes'] || '?'} personne(s)
              </p>
              <div className="mt-auto flex items-center text-blue-600 dark:text-blue-400 font-medium">
                Voir détails <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
