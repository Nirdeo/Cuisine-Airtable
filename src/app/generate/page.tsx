"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wand2, Loader2, ChefHat, X } from "lucide-react";

interface GeneratedRecipe {
  nom: string;
  instructions: string;
  ingredients: string[];
  typePlat: string;
  analyseNutritionnelle: string | object;
  tempsPreparation: string;
  difficulte: string;
}

interface Ingredient {
  id: string;
  fields: {
    Nom: string;
  };
}

export default function GenerateRecipe() {
  const [formData, setFormData] = useState({
    ingredients: [] as string[], // Maintenant un array d'IDs
    nombrePersonnes: 4,
    intolerances: "",
    typePlat: "",
    preferences: ""
  });
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Charger les ingrédients disponibles
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const response = await fetch('/api/ingredients');
        if (response.ok) {
          const ingredients = await response.json();
          // Filtrer les ingrédients qui ont un nom valide
          const validIngredients = ingredients.filter((ingredient: Ingredient) => 
            ingredient.fields && ingredient.fields.Nom && ingredient.fields.Nom.trim() !== ''
          );
          setAvailableIngredients(validIngredients);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des ingrédients:', error);
      }
    };
    loadIngredients();
  }, []);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.ingredient-dropdown')) {
        setShowIngredientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "nombrePersonnes" ? parseInt(value) : value
    }));
  };

  // Gestion de la sélection d'ingrédients
  const addIngredient = (ingredient: Ingredient) => {
    if (!selectedIngredients.find(i => i.id === ingredient.id)) {
      const newSelected = [...selectedIngredients, ingredient];
      setSelectedIngredients(newSelected);
      setFormData(prev => ({
        ...prev,
        ingredients: newSelected.map(i => i.id)
      }));
    }
    setIngredientSearch("");
    setShowIngredientDropdown(false);
  };

  const removeIngredient = (ingredientId: string) => {
    const newSelected = selectedIngredients.filter(i => i.id !== ingredientId);
    setSelectedIngredients(newSelected);
    setFormData(prev => ({
      ...prev,
      ingredients: newSelected.map(i => i.id)
    }));
  };

  // Filtrer les ingrédients selon la recherche
  const filteredIngredients = availableIngredients.filter(ingredient => 
    ingredient.fields.Nom.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
    !selectedIngredients.find(selected => selected.id === ingredient.id)
  );

  // Fonction pour générer une URL d'image aléatoire pour la cuisine
  const generateFoodImageUrl = (recipeName: string) => {
    const imageServices = [
      `https://picsum.photos/800/600?random=${Date.now()}`,
      `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
      `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 1}/800/600`,
    ];
    
    // Sélectionner un service aléatoire
    const randomService = imageServices[Math.floor(Math.random() * imageServices.length)];
    return randomService;
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

  const repairJSON = (jsonString: string): string => {
    try {
      let repaired = jsonString.trim();
      
      // Nettoyer les caractères problématiques
      repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
      repaired = repaired.replace(/]\s*\n\s*"/g, '],\n"');
      repaired = repaired.replace(/,(\s*})/g, '$1');
      
      // Vérifier si le JSON se termine correctement
      if (!repaired.endsWith('}')) {
        // Compter les accolades ouvrantes et fermantes
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        
        // Ajouter les accolades fermantes manquantes
        const missingBraces = openBraces - closeBraces;
        for (let i = 0; i < missingBraces; i++) {
          repaired += '}';
        }
      }
      
      return repaired;
    } catch (error) {
      return jsonString;
    }
  };

  const generateRecipe = async () => {
    if (!formData.ingredients.length) {
      setError("Veuillez sélectionner au moins quelques ingrédients");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const prompt = `Génère une recette de cuisine détaillée avec les contraintes suivantes :

Ingrédients disponibles : ${formData.ingredients.map(id => {
        const ingredient = availableIngredients.find(i => i.id === id);
        return ingredient?.fields.Nom || 'Ingrédient non trouvé';
      }).join(", ")}
Nombre de personnes : ${formData.nombrePersonnes}
Intolérances alimentaires : ${formData.intolerances || "Aucune"}
Type de plat souhaité : ${formData.typePlat || "Libre"}
Préférences culinaires : ${formData.preferences || "Aucune"}

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide et COMPLET, sans texte avant ou après, sans backticks, sans markdown.

Format JSON EXACT requis (RESPECTE EXACTEMENT cette structure) :
{
  "nom": "Nom de la recette",
  "instructions": "Instructions détaillées étape par étape",
  "ingredients": ["ingrédient 1", "ingrédient 2"],
  "typePlat": "Type de plat",
  "analyseNutritionnelle": "Calories: XXX kcal, Protéines: XXg, Glucides: XXg, Lipides: XXg, Vitamines: [liste des vitamines présentes], Minéraux: [liste des minéraux présents]",
  "tempsPreparation": "Temps de préparation",
  "difficulte": "Facile"
}

RÈGLES STRICTES POUR L'ANALYSE NUTRITIONNELLE:
- Calcule les valeurs nutritionnelles RÉELLES basées sur les ingrédients utilisés
- Calories: nombre entier entre 150-800 kcal selon le type de plat
- Protéines: nombre entier en grammes (5-50g selon les ingrédients)
- Glucides: nombre entier en grammes (10-100g selon les ingrédients)
- Lipides: nombre entier en grammes (5-40g selon les ingrédients)
- Vitamines: liste SEULEMENT les vitamines réellement présentes dans les ingrédients (A, B1, B2, B6, B12, C, D, E, K)
- Minéraux: liste SEULEMENT les minéraux réellement présents dans les ingrédients (Fer, Calcium, Magnésium, Potassium, Zinc, Phosphore)
- Format EXACT: "Calories: 350 kcal, Protéines: 25g, Glucides: 45g, Lipides: 12g, Vitamines: B6 C E, Minéraux: Fer Potassium Magnésium"

AUTRES RÈGLES:
- Commence par { et termine par }
- Utilise uniquement des guillemets droits (")
- Chaque propriété doit être suivie d'une virgule SAUF la dernière
- Évite les sauts de ligne dans les valeurs
- Assure-toi que le JSON est COMPLET et VALIDE
- Ne coupe jamais le JSON au milieu`;

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
        
        // Nettoyage supplémentaire pour les caractères problématiques
        jsonContent = jsonContent
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Supprimer les caractères de contrôle
          .replace(/\n/g, '\\n') // Échapper les sauts de ligne
          .replace(/\r/g, '\\r') // Échapper les retours chariot
          .replace(/\t/g, '\\t') // Échapper les tabulations
          .replace(/"/g, '"') // Remplacer les guillemets courbes par des droits
          .replace(/"/g, '"')
          .replace(/'/g, "'") // Remplacer les apostrophes courbes
          .replace(/'/g, "'");
        
        console.log("Contenu JSON nettoyé:", jsonContent);
        
        const repairedJSON = repairJSON(jsonContent);
        console.log("JSON réparé:", repairedJSON);
        
        // Validation supplémentaire : vérifier que le JSON commence et se termine correctement
        if (!repairedJSON.trim().startsWith('{') || !repairedJSON.trim().endsWith('}')) {
          throw new Error("Le JSON ne commence pas par { ou ne se termine pas par }");
        }
        
        const recipe = JSON.parse(repairedJSON);
        
        // Validation des champs requis
        if (!recipe.nom || !recipe.instructions || !recipe.ingredients) {
          throw new Error("Champs requis manquants dans la réponse de l'IA");
        }
        
        // S'assurer que analyseNutritionnelle est une chaîne
        if (recipe.analyseNutritionnelle && typeof recipe.analyseNutritionnelle === 'object') {
          recipe.analyseNutritionnelle = formatAnalyseNutritionnelle(recipe.analyseNutritionnelle);
        }
        
        setGeneratedRecipe(recipe);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        console.error('Contenu reçu:', content);
        setError("Erreur lors de l'analyse de la recette générée. La réponse de l'IA n'est pas au bon format. Veuillez réessayer.");
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
      // Convertir les données de l'IA en format Airtable
      const recetteData = {
        fields: {
          Nom: generatedRecipe.nom,
          Instructions: generatedRecipe.instructions,
          "Type de plat": generatedRecipe.typePlat,
          "Nombre de personnes": formData.nombrePersonnes,
          Intolérances: formData.intolerances || "",
          Image: generateFoodImageUrl(generatedRecipe.nom),
          // Utiliser les IDs des ingrédients sélectionnés pour les relations
          "Ingrédients": formData.ingredients,
          // Utiliser les nouveaux champs texte pour l'affichage
          "Ingrédients (texte)": selectedIngredients.map(i => i.fields.Nom).join(", "),
          "Analyse nutritionnelle (texte)": formatAnalyseNutritionnelle(generatedRecipe.analyseNutritionnelle)
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
        const errorData = await response.json();
        console.error('Erreur de sauvegarde:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de la sauvegarde de la recette: ${errorMessage}`);
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
                <div className="relative ingredient-dropdown">
                  <input
                    type="text"
                    value={ingredientSearch}
                    onChange={(e) => {
                      setIngredientSearch(e.target.value);
                      setShowIngredientDropdown(true);
                    }}
                    onFocus={() => setShowIngredientDropdown(true)}
                    placeholder="Rechercher un ingrédient..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                  />
                  {showIngredientDropdown && filteredIngredients.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                      {filteredIngredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className="px-4 py-2 hover:bg-orange-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-gray-900"
                          onClick={() => addIngredient(ingredient)}
                        >
                          {ingredient.fields.Nom}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Affichage des ingrédients sélectionnés */}
                {selectedIngredients.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Ingrédients sélectionnés :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedIngredients.map((ingredient) => (
                        <span
                          key={ingredient.id}
                          className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                        >
                          {ingredient.fields.Nom}
                          <button
                            onClick={() => removeIngredient(ingredient.id)}
                            className="ml-2 text-orange-600 hover:text-orange-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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