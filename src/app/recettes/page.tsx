"use client";

import { useState, useEffect } from 'react';
import { getAirtableRecettes } from '../utils/airtable';
import Link from 'next/link';
import { ArrowRight, Search, Plus, ChefHat, Filter } from 'lucide-react';

interface Recette {
  id: string;
  fields: {
    Nom: string;
    'Type de plat'?: string;
    'Nombre de personnes'?: number;
    Instructions?: string;
    Ingrédients?: string[];
    'Analyse nutritionnelle'?: string;
    Intolérances?: string;
    Image?: string;
  };
}

export default function RecettesPage() {
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [filteredRecettes, setFilteredRecettes] = useState<Recette[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecettes() {
      try {
        const data = await getAirtableRecettes();
        setRecettes(data);
        setFilteredRecettes(data);
      } catch (error) {
        console.error('Erreur lors du chargement des recettes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecettes();
  }, []);

  useEffect(() => {
    let filtered = recettes;

    if (searchTerm) {
      filtered = filtered.filter(recette => {
        const nom = recette.fields.Nom?.toLowerCase() || '';
        const ingredients = recette.fields.Ingrédients?.join(' ').toLowerCase() || '';
        const typePlat = recette.fields['Type de plat']?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return nom.includes(searchLower) || 
               ingredients.includes(searchLower) || 
               typePlat.includes(searchLower);
      });
    }

    if (selectedType) {
      filtered = filtered.filter(recette => 
        recette.fields['Type de plat'] === selectedType
      );
    }

    setFilteredRecettes(filtered);
  }, [searchTerm, selectedType, recettes]);

  const uniqueTypes = [...new Set(recettes.map(r => r.fields['Type de plat']).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 mx-auto mb-4 text-orange-600 animate-pulse" />
          <p className="text-xl text-gray-600">Chargement des recettes...</p>
        </div>
      </div>
    );
  }

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
              <Link href="/generate" className="text-gray-600 hover:text-orange-600 transition-colors">
                Générer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            🍽️ Mes Recettes
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Découvrez toutes vos recettes avec leur analyse nutritionnelle complète
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/recettes/add">
              <button className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl shadow-lg hover:bg-orange-700 transition-all transform hover:scale-105 flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter une recette
              </button>
            </Link>
            <Link href="/generate">
              <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 flex items-center">
                🤖 Générer avec l'IA
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, ingrédient ou type de plat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white placeholder-gray-500"
              />
            </div>
            
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none text-gray-900 bg-white"
                >
                  <option value="">Tous les types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {filteredRecettes.length} recette(s) trouvée(s)
            {searchTerm && ` pour "${searchTerm}"`}
            {selectedType && ` dans la catégorie "${selectedType}"`}
          </div>
        </div>

        {filteredRecettes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-24 w-24 mx-auto mb-6 text-gray-300" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-4">
              {searchTerm || selectedType ? 'Aucune recette trouvée' : 'Aucune recette disponible'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedType 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre première recette ou générez-en une avec l\'IA'
              }
            </p>
            {!searchTerm && !selectedType && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/recettes/add">
                  <button className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors">
                    Ajouter une recette
                  </button>
                </Link>
                <Link href="/generate">
                  <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors">
                    Générer avec l'IA
                  </button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecettes.map((recette) => (
              <Link
                key={recette.id}
                href={`/recettes/${recette.id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={recette.fields.Image || 'https://picsum.photos/400/300?random=1'}
                      alt={recette.fields.Nom}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      {recette.fields['Type de plat'] && (
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full">
                          {recette.fields['Type de plat']}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {recette.fields.Nom}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>👥 {recette.fields['Nombre de personnes'] || '?'} pers.</span>
                      {recette.fields.Ingrédients && (
                        <span>🥘 {recette.fields.Ingrédients.length} ingrédients</span>
                      )}
                    </div>
                    
                    {recette.fields.Ingrédients && recette.fields.Ingrédients.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Ingrédients principaux :</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {recette.fields.Ingrédients.slice(0, 3).join(', ')}
                          {recette.fields.Ingrédients.length > 3 && '...'}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-orange-600 font-medium text-sm group-hover:text-orange-700 transition-colors">
                        Voir la recette
                      </span>
                      <ArrowRight className="h-4 w-4 text-orange-600 group-hover:text-orange-700 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
