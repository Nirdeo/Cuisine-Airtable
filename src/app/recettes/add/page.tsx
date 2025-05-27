"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addAirtableRecette, getAirtableIngredients, getAirtableAnalyses } from "../../utils/airtable";
import Select from "react-select";
import { Recette } from "../../types/Recettes";
import { ArrowLeft, ChefHat, Save, Loader2 } from "lucide-react";

export default function AddRecette() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [formData, setFormData] = useState<Recette>({
    fields: {
      Nom: "",
      Ingrédients: [],
      "Nombre de personnes": 1,
      Intolérances: "",
      "Type de plat": "",
      Instructions: "",
      "Analyse nutritionnelle": [],
      Image: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    const fetchData = async () => {
      try {
        const ingredientsData = await getAirtableIngredients();
        const analysesData = await getAirtableAnalyses();

        const formattedIngredients = ingredientsData.map((ingredient: any) => ({
          value: ingredient.id,
          label: ingredient.fields.Nom,
        }));

        const formattedAnalyses = analysesData.map((analyse: any) => ({
          value: analyse.id,
          label: analyse.fields.Nom,
        }));

        setIngredients(formattedIngredients);
        setAnalyses(formattedAnalyses);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: name === "Nombre de personnes" ? Number(value) : value,
      },
    }));
  };

  const handleIngredientsChange = (selectedOptions: any) => {
    const selectedValues = selectedOptions.map((option: any) => option.value);
    setFormData((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        Ingrédients: selectedValues,
      },
    }));
  };

  const handleAnalysesChange = (selectedOptions: any) => {
    const selectedValues = selectedOptions.map((option: any) => option.value);
    setFormData((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        "Analyse nutritionnelle": selectedValues,
      },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addAirtableRecette(formData);
      alert("Recette ajoutée avec succès !");
      setFormData({
        fields: {
          Nom: "",
          Ingrédients: [],
          "Nombre de personnes": 1,
          Intolérances: "",
          "Type de plat": "",
          Instructions: "",
          "Analyse nutritionnelle": [],
          Image: "",
        },
      });
      router.push("/recettes");
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'ajout de la recette.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) return null;

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

      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/recettes" className="flex items-center text-orange-600 hover:text-orange-700 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Retour aux recettes
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            ➕ Ajouter une Recette
          </h1>
          <p className="text-xl text-gray-600">
            Créez votre propre recette avec tous les détails nutritionnels
          </p>
        </div>
{/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="Nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la recette *
                </label>
                <input
                  id="Nom"
                  name="Nom"
                  type="text"
                  value={formData.fields.Nom || ""}
                  onChange={handleChange}
                  placeholder="Ex: Tarte aux pommes maison"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="Nombre de personnes" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de personnes
                </label>
                <input
                  id="Nombre de personnes"
                  name="Nombre de personnes"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.fields["Nombre de personnes"] || 1}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="Type de plat" className="block text-sm font-medium text-gray-700 mb-2">
                  Type de plat
                </label>
                <select
                  id="Type de plat"
                  name="Type de plat"
                  value={formData.fields["Type de plat"] || ""}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="Entrée">Entrée</option>
                  <option value="Plat principal">Plat principal</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Apéritif">Apéritif</option>
                  <option value="Salade">Salade</option>
                  <option value="Soupe">Soupe</option>
                </select>
              </div>

              <div>
                <label htmlFor="Intolérances" className="block text-sm font-medium text-gray-700 mb-2">
                  Intolérances alimentaires
                </label>
                <input
                  id="Intolérances"
                  name="Intolérances"
                  type="text"
                  value={formData.fields.Intolérances || ""}
                  onChange={handleChange}
                  placeholder="Ex: Gluten, Lactose, Noix..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
            </div>
{/* Instructions */}
            <div>
              <label htmlFor="Instructions" className="block text-sm font-medium text-gray-700 mb-2">
                Instructions de préparation *
              </label>
              <textarea
                id="Instructions"
                name="Instructions"
                value={formData.fields.Instructions || ""}
                onChange={handleChange}
                placeholder="Décrivez étape par étape comment préparer cette recette..."
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingrédients
              </label>
              <Select
                isMulti
                options={ingredients}
                value={ingredients.filter((opt) => formData.fields.Ingrédients?.includes(opt.value))}
                onChange={handleIngredientsChange}
                placeholder="Sélectionner les ingrédients..."
                className="text-base"
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '48px',
                    borderColor: '#d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    '&:hover': {
                      borderColor: '#f97316'
                    }
                  }),
                  input: (base) => ({
                    ...base,
                    color: '#374151',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#9ca3af',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#374151',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#f97316' : state.isFocused ? '#fed7aa' : '#ffffff',
                    color: state.isSelected ? '#ffffff' : '#374151',
                    '&:hover': {
                      backgroundColor: '#fed7aa',
                      color: '#374151'
                    }
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#fed7aa',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#9a3412',
                  }),
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analyse nutritionnelle
              </label>
              <Select
                isMulti
                options={analyses}
                value={analyses.filter((opt) => formData.fields["Analyse nutritionnelle"]?.includes(opt.value))}
                onChange={handleAnalysesChange}
                placeholder="Sélectionner l'analyse nutritionnelle..."
                className="text-base"
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '48px',
                    borderColor: '#d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    '&:hover': {
                      borderColor: '#f97316'
                    }
                  }),
                  input: (base) => ({
                    ...base,
                    color: '#374151',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#9ca3af',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#374151',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : '#ffffff',
                    color: state.isSelected ? '#ffffff' : '#374151',
                    '&:hover': {
                      backgroundColor: '#dbeafe',
                      color: '#374151'
                    }
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#dbeafe',
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: '#1e40af',
                  }),
                }}
              />
            </div>

            <div>
              <label htmlFor="Image" className="block text-sm font-medium text-gray-700 mb-2">
                Image (URL)
              </label>
              <input
                id="Image"
                name="Image"
                type="url"
                value={(formData.fields.Image as string) || ""}
                onChange={handleImageChange}
                placeholder="https://exemple.com/image-de-votre-recette.jpg"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optionnel : URL d'une image pour illustrer votre recette
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Enregistrer la recette
                  </>
                )}
              </button>
              
              <Link href="/recettes">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Conseils pour une bonne recette</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Soyez précis dans les quantités et les temps de cuisson</li>
            <li>• Décrivez chaque étape clairement pour faciliter la reproduction</li>
            <li>• N'oubliez pas de mentionner les intolérances alimentaires si applicable</li>
            <li>• Une belle image rend votre recette plus appétissante !</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
