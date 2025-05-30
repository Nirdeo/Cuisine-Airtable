import { getAirtableRecetteById } from '../../utils/airtable';
import Link from 'next/link';
import { ArrowLeft, ChefHat, Users, Tag, Utensils, BarChart3 } from 'lucide-react';

interface RecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailPage({ params }: RecipePageProps) {
  const { id } = await params;
  const recette = await getAirtableRecetteById(id);
  const fields = recette.fields as any;

  const ingredients = Array.isArray(fields.Ingrédients) ? fields.Ingrédients : [];
  const analyse = typeof fields['Analyse nutritionnelle'] === 'string' ? fields['Analyse nutritionnelle'] : '';
  const imageUrl = typeof fields.Image === 'string' ? fields.Image : 'https://picsum.photos/800/600?random=2';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">CuisineAI</h1>
            </Link>
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-orange-600 transition-colors">
                Accueil
              </Link>
              <Link href="/recettes" className="text-gray-600 hover:text-orange-600 transition-colors">
                Recettes
              </Link>
              <Link href="/generate" className="text-gray-600 hover:text-orange-600 transition-colors">
                Générer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/recettes" className="flex items-center text-orange-600 hover:text-orange-700 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Retour aux recettes
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative">
                <img src={imageUrl} alt={`Image de ${fields.Nom || 'recette'}`} className="w-full h-80 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h1 className="text-4xl font-bold mb-2">
                    {fields.Nom || 'Recette sans nom'}
                  </h1>
                  {fields['Type de plat'] && (
                    <span className="inline-flex items-center px-3 py-1 bg-orange-600 text-white text-sm font-medium rounded-full">
                      <Tag className="h-4 w-4 mr-1" />
                      {fields['Type de plat']}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2 text-orange-600" />
                    <span className="font-medium">{fields['Nombre de personnes'] || '?'} personne(s)</span>
                  </div>
                  {fields.Intolérances && (
                    <div className="flex items-center text-gray-600">
                      <Utensils className="h-5 w-5 mr-2 text-red-600" />
                      <span className="font-medium">Intolérances : {fields.Intolérances}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <ChefHat className="h-6 w-6 mr-2 text-orange-600" />
                  Instructions de préparation
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {fields.Instructions || 'Pas d\'instructions disponibles.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Utensils className="h-5 w-5 mr-2 text-green-600" />
                Ingrédients
                {ingredients.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {ingredients.length}
                  </span>
                )}
              </h2>
              {ingredients.length > 0 ? (
                <ul className="space-y-3">
                  {ingredients.map((ingredient: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun ingrédient renseigné</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Analyse nutritionnelle
              </h2>
              {analyse ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 whitespace-pre-line leading-relaxed text-sm">
                    {analyse}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Pas d&apos;analyse nutritionnelle disponible</p>
                  <p className="text-sm mt-1">Utilisez notre générateur IA pour obtenir une analyse complète</p>
                </div>
              )}
            </div>


          </div>
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Suggestions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Personnaliser cette recette</h4>
              <p className="text-orange-800 text-sm">
                Utilisez notre générateur IA pour adapter cette recette à vos goûts et intolérances
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Analyser les nutriments</h4>
              <p className="text-green-800 text-sm">
                Obtenez une analyse nutritionnelle détaillée avec notre IA
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Partager votre création</h4>
              <p className="text-blue-800 text-sm">
                Ajoutez vos propres recettes à la collection
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
