import { type Room, type Player, type LangCode } from "@shared/schema";

export const categories = {
  en: {
    animals: ["Lion", "Elephant", "Giraffe", "Penguin", "Dolphin", "Tiger", "Kangaroo", "Zebra", "Panda", "Koala"],
    food: ["Pizza", "Burger", "Sushi", "Pasta", "Taco", "Ice Cream", "Pancake", "Waffle", "Steak", "Salad"],
    jobs: ["Doctor", "Teacher", "Engineer", "Artist", "Chef", "Pilot", "Firefighter", "Police", "Lawyer", "Nurse"],
    objects: ["Chair", "Table", "Laptop", "Phone", "Book", "Pen", "Car", "Bicycle", "Clock", "Lamp"]
  },
  sq: {
    animals: ["Luani", "Elefanti", "Gjirafa", "Pinguini", "Delfini", "Tigri", "Kanguri", "Zebra", "Panda", "Koala", "Qeni", "Maca", "Zog", "Peshk", "Kali", "Lopa", "Dhi", "Derri", "Lepuri", "Mi", "Ari", "Ujku", "Dhelpra", "Dreri", "Mjalta"],
    food: ["Pica", "Burger", "Sushi", "Makarona", "Taco", "Akullore", "Pankek", "Waffle", "Biftek", "Sallatë", "Bukë", "Qumësht", "Djathë", "Vezë", "Mollë", "Banane", "Portokall", "Domate", "Qepë", "Patate", "Oriz", "Supë", "Tortë", "Biskota", "Çokollatë"],
    jobs: ["Doktor", "Mësues", "Inxhinier", "Artist", "Kuzhinier", "Pilot", "Zjarrfikës", "Polic", "Avokat", "Infermier", "Shkencëtar", "Shkrimtar", "Muzikant", "Këngëtar", "Valltar", "Aktor", "Gazetar", "Fotograf", "Arkitekt", "Kontabilist", "Menaxher", "Shofer", "Fermer", "Ndërtues", "Programues"],
    objects: ["Karrige", "Tavolinë", "Laptop", "Telefon", "Libër", "Stilolaps", "Makinë", "Biçikletë", "Orë", "Llampë", "Derë", "Dritare", "Krevat", "Sofë", "Pasqyrë", "Foto", "Çantë", "Kuti", "Çelës", "Kyç", "Kupë", "Pjatë", "Lugë", "Pirun", "Thikë"]
  },
  es: {
    animals: ["León", "Elefante", "Jirafa", "Pingüino", "Delfín", "Tigre", "Canguro", "Cebra", "Panda", "Koala"],
    food: ["Pizza", "Hamburguesa", "Sushi", "Pasta", "Taco", "Helado", "Panqueque", "Waffle", "Bistec", "Ensalada"],
    jobs: ["Doctor", "Maestro", "Ingeniero", "Artista", "Chef", "Piloto", "Bombero", "Policía", "Abogado", "Enfermero"],
    objects: ["Silla", "Mesa", "Portátil", "Teléfono", "Libro", "Bolígrafo", "Coche", "Bicicleta", "Reloj", "Lámpara"]
  },
  de: {
    animals: ["Löwe", "Elefant", "Giraffe", "Pinguin", "Delfin", "Tiger", "Känguru", "Zebra", "Panda", "Koala"],
    food: ["Pizza", "Burger", "Sushi", "Pasta", "Taco", "Eis", "Pfannkuchen", "Waffel", "Steak", "Salat"],
    jobs: ["Arzt", "Lehrer", "Ingenieur", "Künstler", "Koch", "Pilot", "Feuerwehrmann", "Polizist", "Anwalt", "Krankenpfleger"],
    objects: ["Stuhl", "Tisch", "Laptop", "Telefon", "Buch", "Stift", "Auto", "Fahrrad", "Uhr", "Lampe"]
  }
};

export function getRandomWord(lang: LangCode): string {
  const langData = categories[lang] || categories.en;
  const cats = Object.keys(langData) as Array<keyof typeof langData>;
  const randomCat = cats[Math.floor(Math.random() * cats.length)];
  const words = langData[randomCat];
  return words[Math.floor(Math.random() * words.length)];
}
