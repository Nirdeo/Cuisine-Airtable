import Image from "next/image";
import Link from "next/link";
import { ChefHat, Search, Plus, BarChart3, Utensils } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">CuisineAI</h1>
            </div>
            <nav className="flex space-x-6">
              <Link href="/recettes" className="text-gray-600 hover:text-orange-600 transition-colors">
                Recettes
              </Link>
              <Link href="/recettes/add" className="text-gray-600 hover:text-orange-600 transition-colors">
                Ajouter
              </Link>
              <Link href="/generate" className="text-gray-600 hover:text-orange-600 transition-colors">
                Générer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Créez des recettes 
            <span className="text-orange-600"> intelligentes</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Générez des recettes personnalisées avec analyse nutritionnelle complète grâce à l'intelligence artificielle. 
            Gérez vos intolérances alimentaires et découvrez de nouvelles saveurs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/generate">
              <button className="px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-orange-700 transition-all transform hover:scale-105">
                🤖 Générer une recette IA
              </button>
            </Link>
            <Link href="/recettes">
              <button className="px-8 py-4 bg-white text-orange-600 text-lg font-semibold rounded-xl shadow-lg border-2 border-orange-600 hover:bg-orange-50 transition-all">
                📚 Voir les recettes
              </button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Recherche avancée</h3>
            <p className="text-gray-600">
              Trouvez des recettes par nom, ingrédient ou type de plat avec notre moteur de recherche intelligent.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Génération IA</h3>
            <p className="text-gray-600">
              Créez des recettes personnalisées en spécifiant vos ingrédients, le nombre de personnes et vos intolérances.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyse nutritionnelle</h3>
            <p className="text-gray-600">
              Obtenez une analyse complète des calories, protéines, glucides, lipides, vitamines et minéraux.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Utensils className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des intolérances</h3>
            <p className="text-gray-600">
              Spécifiez vos intolérances alimentaires pour des recettes adaptées à vos besoins spécifiques.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à découvrir de nouvelles saveurs ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Commencez dès maintenant à créer des recettes personnalisées avec notre IA culinaire. 
            Chaque recette est analysée nutritionnellement pour vous aider à maintenir une alimentation équilibrée.
          </p>
          <Link href="/generate">
            <button className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105">
              Commencer maintenant
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ChefHat className="h-6 w-6 text-orange-400" />
            <span className="text-xl font-bold">CuisineAI</span>
          </div>
          <p className="text-gray-400">
            Propulsé par Ollama AI • Données stockées sur Airtable • Développé avec Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
