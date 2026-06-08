# Pokemon Showdown Team Generator

Simple app to generate random teams on Pokemon Showdown taking into consideration compatible moves, abilities, items and mega-stones.

## Generation Criteria

Some criterias can be used to define which pokémon will be included in the final team:

- Regions: allows the user to select which regions the pokémon should be from. The options are: Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Hisui and Paldea. By default, all regions are selected, so the generated team can include pokémon from any region.
- Mega Evolution: allows the user to select if the generated team should include mega evolutions or not. If this is selected, at least one pokémon in the team will be a pokémon capable of mega evolving, helding its mega stone and having a compatible move to mega evolve.
- Level Range (min and max): allows the user to select the level range of the pokémon in the generated team. By default, the minimum level is 1 and the maximum level is 100, so the generated team can include pokémon of any level.
- Team Size: allows the user to select the number of pokémon in the generated team. By default, the team size is 6, so the generated team will include 6 pokémon.
- Random Seed: allows the user to select a random seed for the generation process. By default, the random seed is empty, so the generated team will be different every time the user generates a team. If the user enters a random seed, the generated team will be the same every time the user generates a team with that random seed.
- Include Legendaries: allows the user to select if the generated team should include legendary pokémon or not. If this is selected, the generated team will include one legendary pokémon.
- Include Mythicals: allows the user to select if the generated team should include mythical pokémon or not. If this is selected, the generated team will include one mythical pokémon.
- Number of Legendaries: allows the user to select the number of legendary pokémon in the generated team. By default, this is set to 1, so if the user selects to include legendaries, the generated team will include only one legendary pokémon. If the user changes this value, the generated team will include the specified number of legendary pokémon. This setting is ignored if the user does not select to include legendaries.
- Number of Mythicals: allows the user to select the number of mythical pokémon in the generated team. By default, this is set to 1, so if the user selects to include mythicals, the generated team will include only one mythical pokémon. If the user changes this value, the generated team will include the specified number of mythical pokémon. This setting is ignored if the user does not select to include mythicals.
- EV Spread: allows the user to select if the generated team should include EV spreads or not. If this is selected, each pokémon in the generated team will have a random EV spread assigned to it. By default, this is not selected, so the generated team will not include EV spreads. The maximum total EVs for each pokémon is 510, and the maximum EVs for each stat is 252. If the user selects to include EV spreads, the generated team will include random EV spreads for each pokémon, but the total EVs for each pokémon will not exceed 510 and the EVs for each stat will not exceed 252.
- Nature: allows the user to select if the generated team should include natures or not. If this is selected, each pokémon in the generated team will have a random nature assigned to it. By default, this is not selected, so the generated team will not include natures. If the user selects to include natures, the generated team will include random natures for each pokémon.
- Team Size: allows the user to select the number of pokémon in the generated team. By default, the team size is 6, so the generated team will include 6 pokémon. The user can change this value to generate teams of different sizes, but the maximum team size is 6, so if the user selects a team size greater than 6, the generated team will include only 6 pokémon. The team size cannot be lower than the sum of the number of legendaries and mythicals, so if the user selects a team size lower than the sum of the number of legendaries and mythicals, the generated team will include only the specified number of legendaries and mythicals, and the remaining pokémon will be randomly selected from the non-legendary and non-mythical pokémon. The minimum team size is one.

## Generation Logic

- List of pokémon and available moves, abilities and items and megastones will be available as a variable in [pokemon.js](./pokemon.js). The complete information is:
- - Pokémon name
- - Pokémon types
- - Pokémon abilities
- - Pokémon moves (including how the pokémon can learn each move: leveling up, TM/HM, breeding or tutoring)
- - Pokémon items (including if the pokémon can hold the item or not)
- - Pokémon mega stones (including if the pokémon can hold the mega stone and if it has a compatible move to mega evolve or not)
- - Pokémon legendary status (if the pokémon is a legendary or not)
- - Pokémon mythical status (if the pokémon is a mythical or not)
- - Pokémon region (the region the pokémon is from)
- - Pokémon main EV stat (the stat that the pokémon has the highest base stat in)
- The generation process will start by filtering the list of pokémon based on the selected generation criteria

## Workflow

- User selects the generation criteria and clicks on the "Generate Team" button.
- The app generates a random team of pokémon based on the selected criteria and displays it to the user.
- Each pokémon will be represented by its name, level, type(s), ability, item, moves and EVs. The user can edit each pokémon by directly editing the displayed information. The user can also click on the "Regenerate" button regenerate a single pokémon in the team, which will replace the selected pokémon with a new random pokémon that meets the generation criteria. The user can also click on the "Regenerate Team" button to regenerate the entire team, which will replace all pokémon in the team with new random pokémon that meet the generation criteria.
- The pokémon sprite will be displayed next to the pokémon name, and it will update automatically when the pokémon is edited or regenerated. The app will use the official Pokémon sprites from the Pokémon Showdown assets, so the sprites will be consistent with the pokémon's appearance in the games and in Pokémon Showdown. The sprite can be located on the URL: `https://play.pokemonshowdown.com/sprites/ani/<POKEMON_NAME>.gif`. If the GIF does not exists, the app will use the static PNG sprite located on the URL: `https://play.pokemonshowdown.com/sprites/dex/<POKEMON_NAME>.png`. If neither of these sprites exist, the app will display a placeholder image indicating that the sprite is not available. The pokemon name will be on lowercase  and the app will try both GIF and PNG with and without dashs to load the sprite. For example, if the pokémon is "Nidoran♀", the app will try to load the sprite from the following URLs in this order:
  - `https://play.pokemonshowdown.com/sprites/ani/nidoranf.gif`
  - `https://play.pokemonshowdown.com/sprites/dex/nidoranf.png`
  - `https://play.pokemonshowdown.com/sprites/ani/nidoran-f.gif`
  - `https://play.pokemonshowdown.com/sprites/dex/nidoran-f.png`
  - If none of these sprites exist, the app will display a placeholder image indicating that the sprite is not available.
- When editing a pokémon level, the user can enter a value between 1 and 100. If the user enters a value outside this range, the app will automatically adjust it to the nearest valid value (1 if the entered value is less than 1, and 100 if the entered value is greater than 100).
- When editing a pokémon EV, the user can enter a value between 0 and 252 for each stat, and the total EVs for the pokémon cannot exceed 510. If the user enters a value outside this range for a stat, the app will automatically adjust it to the nearest valid value (0 if the entered value is less than 0, and 252 if the entered value is greater than 252). If the total EVs for the pokémon exceed 510, the app will automatically adjust the EVs for each stat proportionally to fit within the 510 total EVs limit.
- When editing a pokémon nature, the user will select the nature from a dropdown menu that includes all the available natures in Pokémon. The app will automatically adjust the EVs for the pokémon based on the selected nature, increasing the EVs for the stat that is boosted by the nature and decreasing the EVs for the stat that is hindered by the nature, while keeping the total EVs within the 510 limit.
- When editing a pokémon moves, the user can select the moves from a dropdown menu that includes all the available moves for that pokémon. The app will automatically ensure that the selected moves are compatible with the pokémon's type(s) and ability, and that the pokémon can learn those moves through leveling up, TM/HM, breeding or tutoring.
- The user can also click on the "Export Team" button to export the generated team in a format that can be imported into Pokemon Showdown. The exported team will be in the following format:

```<POKEMON_NAME> @ <HELD_ITEM>
Ability: <ABILITY_NAME>
Tera Type: <TERA TYPE> (if the pokémon has a tera type)
Level: <LEVEL>
EVs: EV Spread
<NATURE>
- <MOVE_1>
- <MOVE_2>
- <MOVE_3>
- <MOVE_4>
```

Example of an exported team of six pokémon:

```
Iron Valiant @ Booster Energy
Ability: Quark Drive
Tera Type: Ghost
EVs: 252 spa / 4 spd / 252 spe 
Timid Nature
- Calm Mind
- Moonblast
- Shadow Ball
- Encore

Primarina @ Leftovers
Ability: Torrent
Tera Type: Steel
EVs: 80 hp / 252 spa / 176 spe 
Modest Nature
IVs: 0 atk 
- Calm Mind
- Surf
- Moonblast
- Substitute

Zapdos @ Heavy-Duty Boots
Ability: Static
Tera Type: Fire
EVs: 4 def / 252 spa / 252 spe 
Timid Nature
IVs: 0 atk 
- Hurricane
- Volt Switch
- Heat Wave
- Roost

Scizor @ Sitrus Berry
Ability: Technician
Tera Type: Steel
EVs: 248 hp / 252 atk / 8 spd 
Adamant Nature
- Bullet Punch
- U-turn
- Knock Off
- Defog

Weezing-Galar @ Heavy-Duty Boots
Ability: Neutralizing Gas
Tera Type: Flying
EVs: 252 hp / 252 def / 4 spd 
Bold Nature
- Sludge Bomb
- Defog
- Pain Split
- Will-O-Wisp

Tornadus-Therian @ Heavy-Duty Boots
Ability: Regenerator
Tera Type: Steel
EVs: 252 hp / 4 spd / 252 spe 
Timid Nature
- Bleakwind Storm
- U-turn
- Knock Off
- Heat Wave
```

## Credits

Thanks to [PokeAPI](https://github.com/PokeAPI/pokeapi) for the CSV files.