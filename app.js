// Global team variable
let currentTeam = [];
let seededRandom = null;

// Seeded random number generator
function SeededRandom(seed) {
    this.seed = seed;
}
SeededRandom.prototype.random = function() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
};

const TERA_TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];
const TEAM_HISTORY_KEY = 'showdownTeamGeneratorHistory';

function normalizeSpriteName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/♀/g, 'f')
        .replace(/♂/g, 'm')
        .replace(/[^a-z0-9-]/g, '');
}

function buildSpriteVariants(name) {
    const base = normalizeSpriteName(name);
    const variants = [base];
    const noDash = base.replace(/-/g, '');
    if (noDash !== base) {
        variants.push(noDash);
    }
    return [...new Set(variants)];
}

function getSpriteUrl(type, variant) {
    return `https://play.pokemonshowdown.com/sprites/${type}/${variant}.${type === 'ani' ? 'gif' : 'png'}`;
}

function handleSpriteError(img) {
    const variants = img.dataset.spriteVariants ? img.dataset.spriteVariants.split(',') : [];
    let index = parseInt(img.dataset.spriteIndex, 10) || 0;
    let spriteType = img.dataset.spriteType || 'ani';

    if (spriteType === 'ani') {
        img.dataset.spriteType = 'dex';
        img.src = getSpriteUrl('dex', variants[index]);
        return;
    }

    index += 1;
    if (index < variants.length) {
        img.dataset.spriteIndex = index;
        img.dataset.spriteType = 'ani';
        img.src = getSpriteUrl('ani', variants[index]);
        return;
    }

    img.src = '';
}

// Toggle visibility of legendaries count input
document.getElementById('includeLegendaries').addEventListener('change', function() {
    document.getElementById('legendariesCountContainer').style.display = this.checked ? 'block' : 'none';
});

// Toggle visibility of mythicals count input
document.getElementById('includeMythicals').addEventListener('change', function() {
    document.getElementById('mythicalsCountContainer').style.display = this.checked ? 'block' : 'none';
});

// Generate Team button
document.getElementById('generateTeamBtn').addEventListener('click', function() {
    generateTeam();
});

// Regenerate Team button
document.getElementById('regenerateTeamBtn').addEventListener('click', function() {
    generateTeam();
});

// Export Team button
document.getElementById('exportTeamBtn').addEventListener('click', function() {
    exportTeam();
});

// Copy to Clipboard button
document.getElementById('copyToClipboardBtn').addEventListener('click', function() {
    const textarea = document.getElementById('exportTextarea');
    textarea.select();
    document.execCommand('copy');
    alert('Team copied to clipboard!');
});

// Team history selector
const historySelect = document.getElementById('teamHistorySelect');
if (historySelect) {
    historySelect.addEventListener('change', function() {
        if (this.value !== '') {
            loadTeamFromHistory(this.value);
        }
    });
}

const clearHistoryButton = document.getElementById('clearHistoryBtn');
if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', function() {
        clearTeamHistory();
    });
}

function getFilterCriteria() {
    return {
        regions: Array.from(document.querySelectorAll('.region-checkboxes input:checked')).map(el => el.value),
        minLevel: parseInt(document.getElementById('minLevel').value),
        maxLevel: parseInt(document.getElementById('maxLevel').value),
        teamSize: parseInt(document.getElementById('teamSize').value),
        randomSeed: document.getElementById('randomSeed').value,
        includeMega: document.getElementById('includeMega').checked,
        includeLegendaries: document.getElementById('includeLegendaries').checked,
        legendariesCount: parseInt(document.getElementById('legendariesCount').value),
        includeMythicals: document.getElementById('includeMythicals').checked,
        mythicalsCount: parseInt(document.getElementById('mythicalsCount').value),
        includeEVSpread: document.getElementById('includeEVSpread').checked,
        includeNature: document.getElementById('includeNature').checked
    };
}

function getRandomElement(array, random) {
    const idx = Math.floor((random || Math.random)() * array.length);
    return array[idx];
}

function getRandomInt(min, max, random) {
    return Math.floor((random || Math.random)() * (max - min + 1)) + min;
}

function getRandomTeraType(random) {
    return TERA_TYPES[Math.floor((random || Math.random)() * TERA_TYPES.length)];
}

function createTeamMember(selectedPokemon, criteria, random, assignMega = false) {
    const level = getRandomInt(criteria.minLevel, criteria.maxLevel, random);
    const ability = getRandomElement(selectedPokemon.abilities, random);
    const moves = [];

    for (let j = 0; j < 4 && selectedPokemon.moves.length > 0; j++) {
        const move = getRandomElement(selectedPokemon.moves, random);
        if (!moves.includes(move)) {
            moves.push(move);
        }
    }

    const heldItems = (selectedPokemon.items && selectedPokemon.items.length > 0)
        ? selectedPokemon.items
        : (POKEMON_DATA.items || []);

    return {
        id: selectedPokemon.id,
        name: selectedPokemon.name,
        level: level,
        ability: ability,
        item: assignMega && selectedPokemon.megaStones && selectedPokemon.megaStones.length > 0
            ? getRandomElement(selectedPokemon.megaStones, random)
            : getRandomElement(heldItems, random) || 'None',
        moves: moves,
        nature: criteria.includeNature ? getRandomElement(POKEMON_DATA.natures, random) : 'Neutral',
        teraType: getRandomTeraType(random),
        evs: criteria.includeEVSpread ? generateEVSpread(selectedPokemon.baseStats, random) : null,
        types: selectedPokemon.types,
        baseStats: selectedPokemon.baseStats,
        region: selectedPokemon.region,
        megaCandidates: selectedPokemon.megaStones || []
    };
}

function generateEVSpread(baseStats, random) {
    const evs = { hp: 0, attack: 0, defense: 0, spa: 0, spd: 0, spe: 0 };
    let remaining = 510;
    const stats = Object.keys(evs);

    while (remaining > 0) {
        const stat = getRandomElement(stats, random);
        const amount = Math.min(getRandomInt(1, 50, random), 252 - evs[stat], remaining);
        evs[stat] += amount;
        remaining -= amount;
    }

    return evs;
}

function filterPokemon(criteria) {
    if (!POKEMON_DATA || !POKEMON_DATA.pokemon) {
        console.error('Pokemon data not loaded');
        return [];
    }

    let filtered = POKEMON_DATA.pokemon.filter(p => {
        if (criteria.regions.length > 0 && !criteria.regions.includes(p.region)) {
            return false;
        }

        if (!criteria.includeLegendaries && p.isLegendary) {
            return false;
        }

        if (!criteria.includeMythicals && p.isMythical) {
            return false;
        }

        return true;
    });

    return filtered;
}

function generateTeam() {
    const criteria = getFilterCriteria();
    console.log('Generating team with criteria:', criteria);

    const requiredCount = (criteria.includeLegendaries ? criteria.legendariesCount : 0) + (criteria.includeMythicals ? criteria.mythicalsCount : 0);
    if (requiredCount > criteria.teamSize) {
        alert('Team size must be at least the sum of requested legendaries and mythicals. Please increase the team size or reduce the special counts.');
        return;
    }

    if (criteria.randomSeed) {
        seededRandom = new SeededRandom(parseInt(criteria.randomSeed) || Date.now());
    } else {
        seededRandom = null;
    }

    const random = seededRandom ? () => seededRandom.random() : Math.random;
    const filtered = filterPokemon(criteria);

    if (filtered.length === 0) {
        alert('No pokemon match your criteria');
        return;
    }

    const megaCandidates = criteria.includeMega ? filtered.filter(p => p.megaStones && p.megaStones.length > 0) : [];
    if (criteria.includeMega && megaCandidates.length === 0) {
        alert('No mega-capable pokemon match your criteria');
        return;
    }

    const team = [];
    let legendaryCount = 0;
    let mythicalCount = 0;

    if (criteria.includeMega) {
        const megaPokemon = getRandomElement(megaCandidates, random);
        team.push(createTeamMember(megaPokemon, criteria, random, true));
        if (megaPokemon.isLegendary) legendaryCount++;
        if (megaPokemon.isMythical) mythicalCount++;
    }

    for (let i = team.length; i < criteria.teamSize; i++) {
        let selectedPokemon = null;

        if (criteria.includeLegendaries && legendaryCount < criteria.legendariesCount) {
            const legendaries = filtered.filter(p => p.isLegendary);
            if (legendaries.length > 0) {
                selectedPokemon = getRandomElement(legendaries, random);
                legendaryCount++;
            }
        } else if (criteria.includeMythicals && mythicalCount < criteria.mythicalsCount) {
            const mythicals = filtered.filter(p => p.isMythical);
            if (mythicals.length > 0) {
                selectedPokemon = getRandomElement(mythicals, random);
                mythicalCount++;
            }
        }

        if (!selectedPokemon) {
            selectedPokemon = getRandomElement(filtered, random);
        }

        team.push(createTeamMember(selectedPokemon, criteria, random, false));
    }

    currentTeam = team;
    displayTeam(team);
    saveTeamHistory(team);
    populateTeamHistoryDropdown();
}

function getSavedTeamHistory() {
    try {
        const raw = localStorage.getItem(TEAM_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.warn('Failed to load team history from localStorage', error);
        return [];
    }
}

function saveTeamHistory(team) {
    if (!Array.isArray(team) || team.length === 0) return;

    try {
        const history = getSavedTeamHistory();
        const savedTeam = team.map(member => ({ ...member }));
        history.push({ date: new Date().toISOString(), team: savedTeam });
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
            localStorage.setItem(TEAM_HISTORY_KEY, JSON.stringify(history));
        populateTeamHistoryDropdown();
    } catch (error) {
        console.warn('Failed to save team history to localStorage', error);
    }
}

function clearTeamHistory() {
    try {
        localStorage.removeItem(TEAM_HISTORY_KEY);
        populateTeamHistoryDropdown();
        alert('Team history cleared.');
    } catch (error) {
        console.warn('Failed to clear team history', error);
    }
}

function populateTeamHistoryDropdown() {
    const select = document.getElementById('teamHistorySelect');
    if (!select) return;

    const history = getSavedTeamHistory();
    select.innerHTML = '<option value="">Load saved team</option>';

    for (let i = history.length - 1; i >= 0; i--) {
        const entry = history[i];
        const date = entry.date ? new Date(entry.date).toLocaleString() : `Saved team ${history.length - i}`;
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = `${date}`;
        select.appendChild(opt);
    }
}

function loadTeamFromHistory(index) {
    const history = getSavedTeamHistory();
    const historyIndex = parseInt(index, 10);
    if (Number.isNaN(historyIndex) || historyIndex < 0 || historyIndex >= history.length) return;

    const entry = history[historyIndex];
    if (!entry || !Array.isArray(entry.team)) return;

    currentTeam = entry.team;
    displayTeam(currentTeam, false);
}

function loadLastSavedTeam() {
    const history = getSavedTeamHistory();
    if (history.length === 0) return false;

    const lastEntry = history[history.length - 1];
    if (!lastEntry || !Array.isArray(lastEntry.team)) return false;

    currentTeam = lastEntry.team;
    displayTeam(currentTeam, false);
    return true;
}

function displayTeam(team, saveHistory = true) {
    const teamDisplay = document.getElementById('teamDisplay');

    if (team.length === 0) {
        teamDisplay.innerHTML = '<p class="text-muted text-center w-100">Team generated. Pokemon data will be populated here.</p>';
    } else {
        let html = '';
        team.forEach((member, index) => {
            const ev = member.evs || {hp:0, attack:0, defense:0, spa:0, spd:0, spe:0};

            html += `
                        <div class="col-lg-6 col-xl-4 mb-3">
                            <div class="pokemon-card" data-index="${index}">
                                <div class="pokemon-sprite">
                                    <img
                                        src="https://play.pokemonshowdown.com/sprites/ani/${buildSpriteVariants(member.name)[0]}.gif"
                                        alt="${member.name}"
                                        data-sprite-variants="${buildSpriteVariants(member.name).join(',')}"
                                        data-sprite-index="0"
                                        data-sprite-type="ani"
                                        onerror="handleSpriteError(this)">
                                </div>
                                <div class="pokemon-name">${member.name}</div>
                                <div class="pokemon-types">
                                    ${member.types.map(t => `<span class="type-badge" style="background: #666;">${t}</span>`).join('')}
                                </div>
                                <div class="pokemon-details">
                                    <div class="detail-item">
                                        <span class="detail-label">Level</span>
                                        <span class="detail-value"><input class="form-control form-control-sm level-input" data-index="${index}" type="number" min="1" max="100" value="${member.level}"></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Ability</span>
                                        <span class="detail-value"><select class="form-select form-select-sm ability-select" data-index="${index}"></select></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Item</span>
                                        <span class="detail-value"><select class="form-select form-select-sm item-select" data-index="${index}"></select></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Nature</span>
                                        <span class="detail-value"><select class="form-select form-select-sm nature-select" data-index="${index}"></select></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Region</span>
                                        <span class="detail-value">${member.region || 'Unknown'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Tera Type</span>
                                        <span class="detail-value"><select class="form-select form-select-sm tera-select" data-index="${index}"></select></span>
                                    </div>
                                </div>
                                <div class="pokemon-moves">
                                    <span class="moves-label">Moves</span>
                                    <div class="moves-list">
                                        ${[0,1,2,3].map(i => `<select class="form-select form-select-sm move-select mb-1" data-index="${index}" data-move-slot="${i}"></select>`).join('')}
                                    </div>
                                </div>
                                <div class="pokemon-moves" style="border-left-color: #28a745;">
                                    <span class="moves-label" style="color: #28a745;">EVs</span>
                                    <div class="row g-2">
                                        <div class="col-6 col-md-4">
                                            <label class="form-label form-label-sm">HP</label>
                                            <input type="number" min="0" max="252" class="form-control form-control-sm ev-input" data-index="${index}" data-ev="hp" value="${ev.hp}">
                                        </div>
                                        <div class="col-6 col-md-4">
                                            <label class="form-label form-label-sm">Atk</label>
                                            <input type="number" min="0" max="252" class="form-control form-control-sm ev-input" data-index="${index}" data-ev="attack" value="${ev.attack}">
                                        </div>
                                        <div class="col-6 col-md-4">
                                            <label class="form-label form-label-sm">Def</label>
                                            <input type="number" min="0" max="252" class="form-control form-control-sm ev-input" data-index="${index}" data-ev="defense" value="${ev.defense}">
                                        </div>
                                        <div class="col-6 col-md-4">
                                            <label class="form-label form-label-sm">SpA</label>
                                            <input type="number" min="0" max="252" class="form-control form-control-sm ev-input" data-index="${index}" data-ev="spa" value="${ev.spa}">
                                        </div>
                                        <div class="col-6 col-md-4">
                                            <label class="form-label form-label-sm">SpD</label>
                                            <input type="number" min="0" max="252" class="form-control form-control-sm ev-input" data-index="${index}" data-ev="spd" value="${ev.spd}">
                                        </div>
                                        <div class="col-6 col-md-4">
                                            <label class="form-label form-label-sm">Spe</label>
                                            <input type="number" min="0" max="252" class="form-control form-control-sm ev-input" data-index="${index}" data-ev="spe" value="${ev.spe}">
                                        </div>
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-outline-primary btn-regenerate" data-index="${index}">
                                    🔄 Regenerate
                                </button>
                            </div>
                        </div>
                    `;
        });
        teamDisplay.innerHTML = html;

        // Wire up regenerate buttons for individual slots
        document.querySelectorAll('.btn-regenerate').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                regeneratePokemon(index);
            });
        });

        // Populate selects and wire handlers
        team.forEach((member, index) => {
            const monData = POKEMON_DATA.pokemon.find(p => p.id === member.id) || {};

            // Ability select
            const abilitySelect = document.querySelector(`.ability-select[data-index="${index}"]`);
            if (abilitySelect) {
                abilitySelect.innerHTML = '';
                const abilities = (monData.abilities || []).slice().sort((a, b) => a.localeCompare(b));
                abilities.forEach(ab => {
                    const opt = document.createElement('option');
                    opt.value = ab;
                    opt.textContent = ab;
                    if (ab === member.ability) opt.selected = true;
                    abilitySelect.appendChild(opt);
                });
                abilitySelect.addEventListener('change', function() {
                    member.ability = this.value;
                });
            }

            // Item select (offer None + mega candidates)
            const itemSelect = document.querySelector(`.item-select[data-index="${index}"]`);
            if (itemSelect) {
                itemSelect.innerHTML = '';
                const noneOpt = document.createElement('option'); noneOpt.value = 'None'; noneOpt.textContent = 'None'; itemSelect.appendChild(noneOpt);
                const items = (POKEMON_DATA.items || []).slice().sort((a, b) => a.localeCompare(b));
                items.forEach(it => {
                    const opt = document.createElement('option'); opt.value = it; opt.textContent = it; itemSelect.appendChild(opt);
                });
                if (member.megaCandidates && member.megaCandidates.length) {
                    member.megaCandidates.slice().sort((a, b) => a.localeCompare(b)).forEach(ms => {
                        if (![...itemSelect.options].some(o => o.value === ms)) {
                            const opt = document.createElement('option'); opt.value = ms; opt.textContent = ms; itemSelect.appendChild(opt);
                        }
                    });
                }
                if (member.item && member.item !== 'None' && ![...itemSelect.options].some(o => o.value === member.item)) {
                    const opt = document.createElement('option'); opt.value = member.item; opt.textContent = member.item; itemSelect.appendChild(opt);
                }
                itemSelect.value = member.item || 'None';
                itemSelect.addEventListener('change', function() {
                    member.item = this.value;
                });
            }

            // Nature select
            const natureSelect = document.querySelector(`.nature-select[data-index="${index}"]`);
            if (natureSelect) {
                natureSelect.innerHTML = '';
                const natures = (POKEMON_DATA.natures || []).slice().sort((a, b) => a.localeCompare(b));
                natures.forEach(n => {
                    const opt = document.createElement('option'); opt.value = n; opt.textContent = n; if (n === member.nature) opt.selected = true; natureSelect.appendChild(opt);
                });
                natureSelect.addEventListener('change', function() {
                    member.nature = this.value;
                });
            }

            // Tera type select
            const teraSelect = document.querySelector(`.tera-select[data-index="${index}"]`);
            if (teraSelect) {
                teraSelect.innerHTML = '';
                const teraTypes = TERA_TYPES.slice().sort((a, b) => a.localeCompare(b));
                teraTypes.forEach(t => { const opt = document.createElement('option'); opt.value = t; opt.textContent = t; if (t === member.teraType) opt.selected = true; teraSelect.appendChild(opt); });
                teraSelect.addEventListener('change', function() { member.teraType = this.value; });
            }

            // Move selects
            const moveSelects = document.querySelectorAll(`.move-select[data-index="${index}"]`);
            const buildMoveOptions = (slot) => {
                const allMoves = (monData.moves || []).slice().sort((a, b) => a.localeCompare(b));
                const selectedOtherMoves = member.moves
                    .filter((mv, idx) => idx !== slot && mv)
                    .map(mv => mv.toString());
                const options = [];
                if (member.moves[slot] && !allMoves.includes(member.moves[slot])) {
                    options.push(member.moves[slot]);
                }
                allMoves.forEach(mv => {
                    if (mv === member.moves[slot] || !selectedOtherMoves.includes(mv)) {
                        options.push(mv);
                    }
                });
                return options;
            };

            const refreshMoveSelects = () => {
                moveSelects.forEach(otherSel => {
                    const otherSlot = parseInt(otherSel.dataset.moveSlot, 10);
                    otherSel.innerHTML = '';
                    const options = buildMoveOptions(otherSlot);
                    options.forEach(mv => {
                        const opt = document.createElement('option');
                        opt.value = mv;
                        opt.textContent = mv;
                        if (member.moves[otherSlot] === mv) opt.selected = true;
                        otherSel.appendChild(opt);
                    });
                });
            };

            refreshMoveSelects();

            moveSelects.forEach(sel => {
                const slot = parseInt(sel.dataset.moveSlot, 10);
                sel.addEventListener('change', function() {
                    member.moves[slot] = this.value;
                    refreshMoveSelects();
                });
            });

            // Level input
            const levelInput = document.querySelector(`.level-input[data-index="${index}"]`);
            if (levelInput) {
                levelInput.addEventListener('change', function() {
                    let v = parseInt(this.value, 10) || 1; if (v < 1) v = 1; if (v > 100) v = 100; this.value = v; member.level = v;
                });
            }

            // EV inputs
            const evInputs = document.querySelectorAll(`.ev-input[data-index="${index}"]`);
            evInputs.forEach(inp => {
                inp.addEventListener('change', function() {
                    const stat = this.dataset.ev;
                    let v = parseInt(this.value, 10) || 0; if (v < 0) v = 0; if (v > 252) v = 252; this.value = v; member.evs = member.evs || {hp:0, attack:0, defense:0, spa:0, spd:0, spe:0}; member.evs[stat] = v;

                    // enforce total <= 510
                    const total = Object.values(member.evs).reduce((s, x) => s + (parseInt(x,10)||0), 0);
                    if (total > 510) {
                        const scale = 510 / total;
                        Object.keys(member.evs).forEach(k => { member.evs[k] = Math.floor((member.evs[k] || 0) * scale); });
                        // update inputs
                        document.querySelectorAll(`.ev-input[data-index="${index}"]`).forEach(ei => { ei.value = member.evs[ei.dataset.ev]; });
                    }
                });
            });
        });
    }

    document.getElementById('regenerateTeamBtn').disabled = team.length === 0;
    document.getElementById('exportTeamBtn').disabled = team.length === 0;
}

function regeneratePokemon(index) {
    if (index < 0 || index >= currentTeam.length) return;

    const criteria = getFilterCriteria();
    const random = seededRandom ? () => seededRandom.random() : Math.random;
    const filtered = filterPokemon(criteria);

    if (filtered.length === 0) return;

    const selectedPokemon = getRandomElement(filtered, random);
    currentTeam[index] = createTeamMember(selectedPokemon, criteria, random, false);

    displayTeam(currentTeam);
}

window.addEventListener('load', function() {
    populateTeamHistoryDropdown();
    loadLastSavedTeam();
});

function exportTeam() {
    if (currentTeam.length === 0) return;

    let exportText = '';
    currentTeam.forEach(member => {
        const item = member.item !== 'None' ? ` @ ${member.item}` : '';
        exportText += `${member.name}${item}\n`;
        exportText += `Ability: ${member.ability}\n`;
        if (member.teraType) {
            exportText += `Tera Type: ${member.teraType}\n`;
        }
        exportText += `Level: ${member.level}\n`;

        if (member.evs) {
            const evArray = [
                member.evs.hp > 0 ? `${member.evs.hp} HP` : null,
                member.evs.attack > 0 ? `${member.evs.attack} Atk` : null,
                member.evs.defense > 0 ? `${member.evs.defense} Def` : null,
                member.evs.spa > 0 ? `${member.evs.spa} SpA` : null,
                member.evs.spd > 0 ? `${member.evs.spd} SpD` : null,
                member.evs.spe > 0 ? `${member.evs.spe} Spe` : null
            ].filter(ev => ev !== null);
            if (evArray.length > 0) {
                exportText += `EVs: ${evArray.join(' / ')}\n`;
            }
        }

        if (member.nature && member.nature !== 'Neutral') {
            exportText += `${member.nature} Nature\n`;
        }

        member.moves.forEach(move => {
            exportText += `- ${move}\n`;
        });
        exportText += '\n';
    });

    document.getElementById('exportTextarea').value = exportText;
    const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
    exportModal.show();
}
