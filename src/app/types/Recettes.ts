export type AirtableAttachment = {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  thumbnails?: {
    small: { url: string; width: number; height: number };
    large: { url: string; width: number; height: number };
  };
};

export type Recette = {
  id?: string;
  fields: {
    Nom: string;
    "Type de plat"?: string;
    "Nombre de personnes"?: number;
    Instructions?: string;
    Ingrédients?: string[];
    "Ingrédients (texte)"?: string;
    "Ingrédients générés IA"?: string[];
    "Analyse nutritionnelle"?: string[];
    "Analyse nutritionnelle (texte)"?: string;
    Intolérances?: string;
    Image?: string;
  };
};