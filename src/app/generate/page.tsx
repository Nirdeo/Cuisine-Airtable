"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wand2, Loader2, ChefHat } from "lucide-react";

interface GeneratedRecipe {
  nom: string;
  instructions: string;
  ingredients: string[];
  typePlat: string;
  analyseNutritionnelle: string | object;
  tempsPreparation: string;
  difficulte: string;
}

export default function GenerateRecipe() {
  const [formData, setFormData] = useState({
    ingredients: "",
    nombrePersonnes: 4,
    intolerances: "",
    typePlat: "",
    preferences: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "nombrePersonnes" ? parseInt(value) : value
    }));
  };

  const formatAnalyseNutritionnelle = (analyse: string | object): string => {
    if (typeof analyse === 'string') {
      return analyse;
    }
    
    if (typeof analyse === 'object' && analyse !== null) {
      return Object.entries(analyse)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    
    return 'Analyse nutritionnelle non disponible';
  };

  const generateRecipe = async () => {
    if (!formData.ingredients.trim()) {
      setError("Veuillez spécifier au moins quelques ingrédients");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const prompt = `Génère une recette de cuisine détaillée avec les contraintes suivantes :

Ingrédients disponibles : ${formData.ingredients}
Nombre de personnes : ${formData.nombrePersonnes}
Intolérances alimentaires : ${formData.intolerances || "Aucune"}
Type de plat souhaité : ${formData.typePlat || "Libre"}
Préférences culinaires : ${formData.preferences || "Aucune"}

Réponds UNIQUEMENT au format JSON suivant (sans markdown, sans backticks) :
{
  "nom": "Nom de la recette",
  "instructions": "Instructions détaillées étape par étape",
  "ingredients": ["ingrédient 1", "ingrédient 2", "..."],
  "typePlat": "Type de plat (entrée/plat/dessert)",
  "analyseNutritionnelle": "Analyse nutritionnelle détaillée avec calories, protéines, glucides, lipides, vitamines et minéraux pour ${formData.nombrePersonnes} personnes sous forme de TEXTE",
  "tempsPreparation": "Temps de préparation estimé",
  "difficulte": "Niveau de difficulté (Facile/Moyen/Difficile)"
}

IMPORTANT: L'analyseNutritionnelle doit être une chaîne de caractères, pas un objet JSON.
Assure-toi que la recette respecte les intolérances alimentaires mentionnées et utilise principalement les ingrédients fournis.`;

      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'llama3.2',
          options: {
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de la recette');
      }

      const data = await response.json();
      const content = data.message?.content || '';
      
      try {
        let jsonContent = content.trim();
        
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        const recipe = JSON.parse(jsonContent);
        
        if (recipe.analyseNutritionnelle && typeof recipe.analyseNutritionnelle === 'object') {
          recipe.analyseNutritionnelle = formatAnalyseNutritionnelle(recipe.analyseNutritionnelle);
        }
        
        setGeneratedRecipe(recipe);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        setError("Erreur lors de l'analyse de la recette générée. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError("Erreur lors de la génération de la recette. Vérifiez que Ollama est en cours d'exécution.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRecipe = async () => {
    if (!generatedRecipe) return;

    try {
      const recetteData = {
        fields: {
          Nom: generatedRecipe.nom,
          Instructions: generatedRecipe.instructions,
          Ingrédients: generatedRecipe.ingredients,
          "Type de plat": generatedRecipe.typePlat,
          "Nombre de personnes": formData.nombrePersonnes,
          "Analyse nutritionnelle": generatedRecipe.analyseNutritionnelle,
          Intolérances: formData.intolerances,
          Image: `https://source.unsplash.com/800x600/?${encodeURIComponent(generatedRecipe.nom)},food`
        }
      };

      const response = await fetch('/api/recettes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recetteData),
      });

      if (response.ok) {
        alert("Recette sauvegardée avec succès !");
        router.push('/recettes');
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert("Erreur lors de la sauvegarde de la recette.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">CuisineAI</h1>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 hover:text-orange-600 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            🤖 Générateur de Recettes IA
          </h1>
          <p className="text-xl text-gray-600">
            Laissez l'intelligence artificielle créer une recette personnalisée pour vous
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de génération */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Paramètres de génération</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingrédients disponibles *
                </label>
                <textarea
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleInputChange}
                  placeholder="Ex: tomates, mozzarella, basilic, huile d'olive..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de personnes
                </label>
                <input
                  type="number"
                  name="nombrePersonnes"
                  value={formData.nombrePersonnes}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de plat souhaité
                </label>
                <select
                  name="typePlat"
                  value={formData.typePlat}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                >
                  <option value="">Libre choix</option>
                  <option value="Entrée">Entrée</option>
                  <option value="Plat principal">Plat principal</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Apéritif">Apéritif</option>
                  <option value="Salade">Salade</option>
                  <option value="Soupe">Soupe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intolérances alimentaires
                </label>
                <input
                  type="text"
                  name="intolerances"
                  value={formData.intolerances}
                  onChange={handleInputChange}
                  placeholder="Ex: gluten, lactose, noix..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Préférences culinaires
                </label>
                <input
                  type="text"
                  name="preferences"
                  value={formData.preferences}
                  onChange={handleInputChange}
                  placeholder="Ex: cuisine méditerranéenne, épicé, végétarien..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={generateRecipe}
                disabled={isGenerating}
                className="w-full flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Générer la recette
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Résultat de la génération */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recette générée</h2>
            
            {!generatedRecipe && !isGenerating && (
              <div className="text-center py-12 text-gray-500">
                <Wand2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Remplissez le formulaire et cliquez sur "Générer" pour créer votre recette personnalisée</p>
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-12">
                <Loader2 className="animate-spin h-16 w-16 mx-auto mb-4 text-orange-600" />
                <p className="text-gray-600">L'IA cuisine votre recette...</p>
              </div>
            )}

            {generatedRecipe && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-orange-600 mb-2">{generatedRecipe.nom}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {generatedRecipe.typePlat}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {generatedRecipe.tempsPreparation}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {generatedRecipe.difficulte}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Ingrédients :</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {generatedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Instructions :</h4>
                  <p className="text-gray-700 whitespace-pre-line">{generatedRecipe.instructions}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Analyse nutritionnelle :</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {generatedRecipe.analyseNutritionnelle ? 
                      formatAnalyseNutritionnelle(generatedRecipe.analyseNutritionnelle) : 
                      'Analyse nutritionnelle non disponible'
                    }
                  </p>
                </div>

                <button
                  onClick={saveRecipe}
                  className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  💾 Sauvegarder cette recette
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 