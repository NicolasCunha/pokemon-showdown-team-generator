# Pokemon Showdown Team Generator

Simple app to generate random Pokémon Showdown teams with support for items, mega stones, abilities, moves, EVs, natures and browser history.

## Features

- Random team generation using the data in [pokemon.js](./pokemon.js)
- Region filters for Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Hisui and Paldea
- Mega Evolution support with exactly one team member holding a mega stone when enabled
- Legendary and mythical inclusion toggles with configurable counts
- Level range, team size, random seed, EV spread and nature options
- Editable per-Pokémon fields: level, ability, item, nature, tera type, and moves
- Regenerate whole team or regenerate individual Pokémon slots
- Export generated teams in Showdown-compatible text format
- Move dropdowns are sorted and prevent duplicate moves for the same Pokémon
- Ability, item, nature, and tera type dropdowns are all sorted alphabetically
- Browser history saves generated teams to `localStorage`
- On page load, the last saved team is restored automatically

## Data Source

`pokemon.js` contains the dataset used by the app, including:

- Pokémon name and types
- Abilities
- Moves
- Held items
- Mega stones
- Legendary/mythical status
- Region
- Base stats

## How It Works

- The app filters available Pokémon based on selected criteria.
- When mega evolution is enabled, one random mega-capable Pokémon is selected and given a mega stone.
- Other team members receive a regular held item from the available item pool.
- Each team member may be configured with a random nature, tera type, and EV spread.
- Moves are selected without duplicates within the same Pokémon.
- The generated team is shown immediately and can be edited in place.
- Generated team data is saved to browser history, and the last saved team is loaded when the page opens.

## Usage

1. Open `index.html` in your browser.
2. Choose desired criteria and click **Generate Team**.
3. Use **Regenerate Team** to create a new team with the same criteria.
4. Use the card-level **Regenerate** buttons to reroll one Pokémon.
5. Edit any dropdowns or values directly in the displayed team.
6. Click **Export Team** to copy the team text for Pokémon Showdown.

## Notes

- Level values are clamped between 1 and 100.
- EV values are clamped between 0 and 252 per stat, with a total maximum of 510.
- The app preserves the most recent generated team in browser local storage.

## Credits

Thanks to [PokeAPI](https://github.com/PokeAPI/pokeapi) for the CSV files.
