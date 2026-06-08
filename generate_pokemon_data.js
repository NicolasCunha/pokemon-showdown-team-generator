const fs = require('fs');
const path = require('path');

const CSV_DIR = 'csv';
const ENGLISH_LANG_ID = 9;

// Simple CSV parser
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = line.split(',').map(v => v.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }
  
  return records;
}

// Helper to read CSV file
function readCSV(filename) {
  const content = fs.readFileSync(path.join(CSV_DIR, filename), 'utf-8');
  return parseCSV(content);
}

// Load pokemon basic data
function loadPokemon() {
  console.log('Loading pokemon data...');
  const records = readCSV('pokemon.csv');
  const pokemon = {};
  const speciesMap = {}; // Map species_id to default pokemon_id
  const megaSpeciesMap = {}; // Map species_id to mega pokemon IDs
  
  records.forEach(row => {
    const speciesId = parseInt(row.species_id);
    const pokemonId = parseInt(row.id);
    
    // Track the default form for each species
    if (row.is_default === '1') {
      speciesMap[speciesId] = pokemonId;
    }
  });
  
  // Find mega forms
  const pokemonForms = readCSV('pokemon_forms.csv');
  pokemonForms.forEach(row => {
    if (row.is_mega === '1') {
      // Get species_id from pokemon table for this mega form
      const megaPokemonId = parseInt(row.pokemon_id); // Actually this is the pokemon_id for mega forms
      const megoPokemonRecord = records.find(r => parseInt(r.id) === megaPokemonId);
      if (megoPokemonRecord) {
        const speciesId = parseInt(megoPokemonRecord.species_id);
        if (!megaSpeciesMap[speciesId]) {
          megaSpeciesMap[speciesId] = [];
        }
        megaSpeciesMap[speciesId].push(megaPokemonId);
      }
    }
  });
  
  records.forEach(row => {
    // Only include default forms (base pokemon, not megas or other forms)
    if (row.is_default !== '1') {
      return;
    }

    const pokemonId = parseInt(row.id);

    // Normalize identifier: unify gendered forms (e.g., 'pyroar-male'/'pyroar-female' -> 'pyroar')
    let identifier = String(row.identifier || '');
    identifier = identifier.replace(/-(male|female)$/i, '');

    const name = identifier.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

    pokemon[pokemonId] = {
      id: pokemonId,
      name: name,
      abilities: [],
      moves: [],
      megaStones: [],
      items: [],
      types: [],
      baseStats: {},
      isLegendary: false,
      isMythical: false,
      region: 'Unknown'
    };
  });
  
  console.log(`Loaded ${Object.keys(pokemon).length} base pokemon`);
  return { pokemon, speciesMap, megaSpeciesMap };
}

// Load pokemon types
function loadTypes(pokemon) {
  console.log('Loading types...');
  const typeNames = {};
  
  // Load type names (English only)
  const typeNameRecords = readCSV('type_names.csv');
  typeNameRecords.forEach(row => {
    if (parseInt(row.local_language_id) === ENGLISH_LANG_ID) {
      const typeId = parseInt(row.type_id);
      typeNames[typeId] = row.name;
    }
  });
  
  // Link types to pokemon
  const pokemonTypes = readCSV('pokemon_types.csv');
  pokemonTypes.forEach(row => {
    const pokemonId = parseInt(row.pokemon_id);
    const typeId = parseInt(row.type_id);
    
    if (pokemon[pokemonId] && typeNames[typeId]) {
      pokemon[pokemonId].types.push(typeNames[typeId]);
    }
  });
}

// Load pokemon stats
function loadStats(pokemon) {
  console.log('Loading base stats...');
  const statNames = {
    1: 'hp',
    2: 'attack',
    3: 'defense',
    4: 'spa',
    5: 'spd',
    6: 'spe'
  };
  
  const pokemonStats = readCSV('pokemon_stats.csv');
  pokemonStats.forEach(row => {
    const pokemonId = parseInt(row.pokemon_id);
    const statId = parseInt(row.stat_id);
    
    if (pokemon[pokemonId] && statNames[statId]) {
      pokemon[pokemonId].baseStats[statNames[statId]] = parseInt(row.base_stat);
    }
  });
}

// Load legendary and mythical status
function loadSpecialStatus(pokemon) {
  console.log('Loading legendary/mythical status...');
  const pokemonSpecies = readCSV('pokemon_species.csv');
  
  pokemonSpecies.forEach(row => {
    const id = parseInt(row.id);
    if (pokemon[id]) {
      pokemon[id].isLegendary = row.is_legendary === '1';
      pokemon[id].isMythical = row.is_mythical === '1';
    }
  });
}

// Load pokemon regions
function loadRegions(pokemon) {
  console.log('Loading regions...');

  const regionRecords = readCSV('pokemon_region.csv');
  const regionRanges = regionRecords
    .map(row => ({
      region: row.region,
      start: parseInt(row.start_id, 10),
      end: parseInt(row.end_id, 10)
    }))
    .filter(entry => !isNaN(entry.start) && !isNaN(entry.end));

  Object.values(pokemon).forEach(mon => {
    const id = mon.id;
    const match = regionRanges.find(entry => id >= entry.start && id <= entry.end);
    if (match) {
      mon.region = match.region;
    }
  });

  if (regionRanges.length === 0) {
    console.warn('pokemon_region.csv did not provide region mappings; region values remain default.');
  }
}

// Load abilities for each pokemon
function loadAbilities(pokemon) {
  console.log('Loading abilities...');
  const abilityNames = {};
  
  // Load ability names (English only)
  const abilityNameRecords = readCSV('ability_names.csv');
  abilityNameRecords.forEach(row => {
    if (parseInt(row.local_language_id) === ENGLISH_LANG_ID) {
      const abilityId = parseInt(row.ability_id);
      abilityNames[abilityId] = row.name;
    }
  });
  
  // Link abilities to pokemon
  const pokemonAbilities = readCSV('pokemon_abilities.csv');
  pokemonAbilities.forEach(row => {
    const pokemonId = parseInt(row.pokemon_id);
    const abilityId = parseInt(row.ability_id);
    
    if (pokemon[pokemonId] && abilityNames[abilityId]) {
      if (!pokemon[pokemonId].abilities.includes(abilityNames[abilityId])) {
        pokemon[pokemonId].abilities.push(abilityNames[abilityId]);
      }
    }
  });
}

// Load moves for each pokemon
function loadMoves(pokemon) {
  console.log('Loading moves...');
  const moveNames = {};
  
  // Load move names (English only)
  const moveNameRecords = readCSV('move_names.csv');
  moveNameRecords.forEach(row => {
    if (parseInt(row.local_language_id) === ENGLISH_LANG_ID) {
      const moveId = parseInt(row.move_id);
      moveNames[moveId] = row.name;
    }
  });
  
  // Link moves to pokemon
  const pokemonMoves = readCSV('pokemon_moves.csv');
  pokemonMoves.forEach(row => {
    const pokemonId = parseInt(row.pokemon_id);
    const moveId = parseInt(row.move_id);
    
    if (pokemon[pokemonId] && moveNames[moveId]) {
      const moveName = moveNames[moveId];
      if (!pokemon[pokemonId].moves.includes(moveName)) {
        pokemon[pokemonId].moves.push(moveName);
      }
    }
  });
}

// Load mega stones
function loadMegaStones(pokemon, speciesMap, megaSpeciesMap) {
  console.log('Loading mega stones...');

  function normalizeName(name) {
    return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  const nameToPokemonId = {};
  Object.entries(pokemon).forEach(([id, mon]) => {
    nameToPokemonId[normalizeName(mon.name)] = parseInt(id, 10);
  });

  const megaStoneRecords = readCSV('mega_stones.csv');
  megaStoneRecords.forEach(row => {
    const pokemonName = normalizeName(row.Pokemon);
    const megaStone = row['Mega Stone'] ? row['Mega Stone'].trim() : '';
    const pokemonId = nameToPokemonId[pokemonName];

    if (pokemonId && pokemon[pokemonId] && megaStone) {
      if (!pokemon[pokemonId].megaStones.includes(megaStone)) {
        pokemon[pokemonId].megaStones.push(megaStone);
      }
    }
  });

  // Fallback: if a base pokemon has a mega form but no mega stone from the CSV,
  // try to infer a matching mega stone from the item data.
  const itemNames = {};
  const itemIdentifiers = {};

  const itemRecords = readCSV('items.csv');
  itemRecords.forEach(row => {
    itemIdentifiers[parseInt(row.id, 10)] = row.identifier;
  });

  const itemNameRecords = readCSV('item_names.csv');
  itemNameRecords.forEach(row => {
    if (parseInt(row.local_language_id, 10) === ENGLISH_LANG_ID) {
      itemNames[parseInt(row.item_id, 10)] = row.name;
    }
  });

  const pokemonItems = readCSV('pokemon_items.csv');
  const heldItemNames = new Set();
  pokemonItems.forEach(row => {
    const pokemonId = parseInt(row.pokemon_id, 10);
    const itemId = parseInt(row.item_id, 10);

    if (pokemon[pokemonId] && itemIdentifiers[itemId] && itemNames[itemId]) {
      const identifier = itemIdentifiers[itemId];
      const itemName = itemNames[itemId];
      heldItemNames.add(itemName);

      if (!pokemon[pokemonId].items.includes(itemName)) {
        pokemon[pokemonId].items.push(itemName);
      }

      // If identifier ends with 'ite', consider as mega stone candidate as well
      if (identifier.endsWith('ite')) {
        const megaStone = itemName;
        if (!pokemon[pokemonId].megaStones.includes(megaStone)) {
          pokemon[pokemonId].megaStones.push(megaStone);
        }
      }
    }
  });

  Object.keys(megaSpeciesMap).forEach(speciesIdStr => {
    const speciesId = parseInt(speciesIdStr, 10);
    const basePokemonId = speciesMap[speciesId];

    if (basePokemonId && pokemon[basePokemonId] && pokemon[basePokemonId].megaStones.length === 0) {
      const baseName = normalizeName(pokemon[basePokemonId].name);
      let bestMatch = null;
      let bestScore = 0;

      Object.keys(itemIdentifiers).forEach(itemIdStr => {
        const itemId = parseInt(itemIdStr, 10);
        const identifier = itemIdentifiers[itemId];
        if (identifier && identifier.endsWith('ite') && itemNames[itemId]) {
          const itemBase = normalizeName(identifier.replace(/-ite$/, ''));
          let matchCount = 0;
          for (let char of baseName) {
            if (itemBase.includes(char)) {
              matchCount++;
            }
          }
          const score = matchCount / Math.max(baseName.length, itemBase.length);
          if (score > bestScore && score > 0.6) {
            bestScore = score;
            bestMatch = itemNames[itemId];
          }
        }
      });

      if (bestMatch && !pokemon[basePokemonId].megaStones.includes(bestMatch)) {
        pokemon[basePokemonId].megaStones.push(bestMatch);
      }
    }
  });
  return { itemNames, heldItemNames };
}

// Load natures
function loadNatures() {
  console.log('Loading natures...');
  const natures = new Set();
  const natureRecords = readCSV('nature_names.csv');
  
  natureRecords.forEach(row => {
    if (parseInt(row.local_language_id) === ENGLISH_LANG_ID) {
      natures.add(row.name);
    }
  });
  
  return Array.from(natures).sort();
}

// Main generation function
function generatePokemonJS() {
  try {
    const { pokemon, speciesMap, megaSpeciesMap } = loadPokemon();
    loadAbilities(pokemon);
    loadMoves(pokemon);
    const { itemNames, heldItemNames } = loadMegaStones(pokemon, speciesMap, megaSpeciesMap);
    loadTypes(pokemon);
    loadStats(pokemon);
    loadSpecialStatus(pokemon);
    loadRegions(pokemon);
    const natures = loadNatures();
    
    console.log(`Loaded ${natures.length} natures`);
    
    // Convert pokemon object to sorted array
    const pokemonList = Object.values(pokemon).sort((a, b) => a.name.localeCompare(b.name));
    
    // Build global items list from held pokemon items only
    const globalItems = Array.from(heldItemNames || []).filter(Boolean).sort();

    // Create data structure
    const data = {
      pokemon: pokemonList,
      natures: natures,
      items: globalItems
    };
    
    // Generate JavaScript file
    let jsContent = '// Auto-generated Pokemon data\n';
    jsContent += 'const POKEMON_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
    jsContent += '\n// Export for use in index.html\n';
    jsContent += 'if (typeof module !== \'undefined\' && module.exports) {\n';
    jsContent += '  module.exports = POKEMON_DATA;\n';
    jsContent += '}\n';
    
    // Write to file
    fs.writeFileSync('pokemon.js', jsContent, 'utf-8');
    
    console.log(`\n✓ Generated pokemon.js with ${pokemonList.length} pokemon and ${natures.length} natures`);
    console.log(`File size: ${jsContent.length} bytes`);
    
    // Print sample data
    console.log('\n=== Sample Data ===');
    console.log(`First pokemon: ${JSON.stringify(pokemonList[0], null, 2)}`);
    console.log(`First 5 natures: ${natures.slice(0, 5).join(', ')}`);
    
  } catch (error) {
    console.error('Error generating pokemon.js:', error.message);
    process.exit(1);
  }
}

generatePokemonJS();
