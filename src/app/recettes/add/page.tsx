"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addAirtableRecette, getAirtableIngredients, getAirtableAnalyses } from "../../utils/airtable";
import Select from "react-select";
import { Recette } from "../../types/Recettes";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🍽️ Ajouter une recette</h1>
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {[ 
            { label: "Nom", name: "Nom", type: "text", placeholder: "Ex: Tarte aux pommes" },
            { label: "Nombre de personnes", name: "Nombre de personnes", type: "number", placeholder: "4" },
            { label: "Instructions", name: "Instructions", type: "textarea", placeholder: "Mélanger, cuire, servir..." },
            { label: "Intolérances", name: "Intolérances", type: "text", placeholder: "Gluten, Lactose..." },
            { label: "Type de plat", name: "Type de plat", type: "text", placeholder: "Entrée, Plat, Dessert" },
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <label htmlFor={field.name} className="text-gray-700 font-medium mb-2">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData.fields[field.name as keyof Recette["fields"]] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={4}
                  className="border-2 border-gray-400 p-4 rounded-xl bg-gray-100 shadow-sm"
                  required
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={formData.fields[field.name as keyof Recette["fields"]] !== undefined 
                    ? formData.fields[field.name as keyof Recette["fields"]]!.toString() 
                    : ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="border-2 border-gray-400 p-4 rounded-xl bg-gray-100 shadow-sm"
                  required
                />
              )}
            </div>
          ))}

          <div className="flex flex-col">
            <label className="text-gray-700 font-medium mb-2">Ingrédients</label>
            <Select
              isMulti
              options={ingredients}
              value={ingredients.filter((opt) => formData.fields.Ingrédients.includes(opt.value))}
              onChange={handleIngredientsChange}
              placeholder="Sélectionner les ingrédients"
              className="text-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 font-medium mb-2">Analyse nutritionnelle</label>
            <Select
              isMulti
              options={analyses}
              value={analyses.filter((opt) => formData.fields["Analyse nutritionnelle"].includes(opt.value))}
              onChange={handleAnalysesChange}
              placeholder="Sélectionner l'analyse nutritionnelle"
              className="text-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 font-medium mb-2">Image (URL)</label>
            <input
              type="url"
              name="Image"
              value={formData.fields.Image || ""}
              onChange={handleImageChange}
              placeholder="URL de l'image"
              className="border-2 border-gray-400 p-4 rounded-xl bg-gray-100 shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-green-700 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Envoi en cours..." : "✅ Ajouter la recette"}
          </button>
        </form>
      </div>
    </div>
  );
}
