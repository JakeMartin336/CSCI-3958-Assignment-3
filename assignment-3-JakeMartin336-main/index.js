import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';
// import swaggerDocument from './swagger.json' assert { type: 'json' };
import swaggerDocument from './swagger.json' with { type: 'json' };

const app = express();
// This allows us to parse JSON data from the request body (if any).
app.use(express.json())

// Swagger config
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = 3000;

// *Hint: use this array to store a list of objects of each of the caught Pokémon.
const CAUGHT_POKEMON = [];
const BAG_LIST = [];

// *Hint: use uuidv4 to generate a random IDr
let uniqueID = uuidv4();

// Root route to get your started + check for PokeAPI connectivity.
app.get('/', async (req, res) => {
  await fetch('https://pokeapi.co/api/v2/')
    .then(() => {
      res.send(`
        <html lang="en-US">
           <h1>PokeAPI Online!</h1>
           <h3>Head on over to <a href="http://localhost:3000/api-docs">/api-docs</a> to get started!</h3>
        </html>
      `);
    })
    .catch((e) => {
      res.send(`
        <html lang="en-US">
           <h1>PokeAPI is down.</h1>
           <h3>Check <a href="https://pokeapi.statuspage.io/">https://pokeapi.statuspage.io/</a> for status updates</h3>
           <div>Error: ${e}</div>
        </html>
      `);
    })
})

/*
* Start implementing the endpoints below!
* */

app.get('/pokemon/:id', async (req, res) => {
  console.log('GET /pokemon/:id request received.', req.params);
  const pokemonId = req.params.id;
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  if (!response.ok) {
    return res.status(400).json("Invalid Pokémon ID given.");
  }
  const data = await response.json();
  const formattedData = {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    stats: {
      hp: data.stats.find(stat => stat.stat.name === 'hp').base_stat,
      attack: data.stats.find(stat => stat.stat.name === 'attack').base_stat,
      defense: data.stats.find(stat => stat.stat.name === 'defense').base_stat,
      specialAttack: data.stats.find(stat => stat.stat.name === 'special-attack').base_stat,
      specialDefense: data.stats.find(stat => stat.stat.name === 'special-defense').base_stat,
      speed: data.stats.find(stat => stat.stat.name === 'speed').base_stat,
    },
  };
  res.status(200).json(formattedData);
})


app.post('/pokemon/catch', async (req, res) => {
  console.log('POST /pokemon/catch request received.', req.body);
  const pokemons = req.body;
  if (!Array.isArray(pokemons) || pokemons.length === 0) {
    return res.status(400).json("Request must contain a non-empty array of Pokémon IDs or names.");
  }
  const caughtPokemons = [];
  for (const pokemon of pokemons) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    if (!response.ok) {
      continue;
    }
    const data = await response.json();
    const caughtPokemon = {
      id: data.id,
      caughtPokemonId: uuidv4(),
      name: data.name,
      height: data.height,
      weight: data.weight,
      stats: {
        hp: data.stats.find(stat => stat.stat.name === 'hp').base_stat,
        attack: data.stats.find(stat => stat.stat.name === 'attack').base_stat,
        defense: data.stats.find(stat => stat.stat.name === 'defense').base_stat,
        specialAttack: data.stats.find(stat => stat.stat.name === 'special-attack').base_stat,
        specialDefense: data.stats.find(stat => stat.stat.name === 'special-defense').base_stat,
        speed: data.stats.find(stat => stat.stat.name === 'speed').base_stat,
      },
    };
    CAUGHT_POKEMON.push(caughtPokemon);
  }  
  res.status(200).json(CAUGHT_POKEMON);
})


app.get('/pokemon/caught/:caughtPokemonId', (req, res) => {
  console.log('GET /pokemon/caught/:caughtPokemonId request received.', req.params);
  const caughtPokemonId = req.params.caughtPokemonId;
  const caughtPokemon = CAUGHT_POKEMON.find(pokemon => pokemon.caughtPokemonId === caughtPokemonId);
  if (caughtPokemon) {
      res.status(200).json(caughtPokemon);
  } else {
      res.status(404).json({});
  }
})


app.delete('/pokemon/caught/:caughtPokemonId', (req, res) => {
  console.log('DELETE /pokemon/caught/:caughtPokemonId request received.', req.params);
  const caughtPokemonId = req.params.caughtPokemonId;
  const index = CAUGHT_POKEMON.findIndex(pokemon => pokemon.caughtPokemonId === caughtPokemonId);
  if (index !== -1) {
    CAUGHT_POKEMON.splice(index, 1);
    res.status(200).send(`Successfully deleted Pokémon: ${caughtPokemonId}`);
  } else {
    res.status(400).send(`Invalid caughtPokemonId: ${caughtPokemonId}`);
  }
  console.log(CAUGHT_POKEMON);
})


app.post('/pokemon/teach/:caughtPokemonId', async (req, res) => {
  console.log('POST /pokemon/teach/:caughtPokemonId request received.', req.params, req.body);
  
  const caughtPokemonId = req.params.caughtPokemonId;
  const newMoves = req.body;
  
  if (!Array.isArray(newMoves) || newMoves.length > 4) {
    return res.status(400).json({ error: 'Invalid moves input. Provide an array of up to 4 moves.' });
  }

  const pokemon = CAUGHT_POKEMON.find(p => p.caughtPokemonId === caughtPokemonId);
  if (!pokemon) {
    return res.status(404).json({ error: `Invalid caughtPokemonId: ${caughtPokemonId}` });
  }


  const fetchedMoves = [];
  for (const move of newMoves) {
    const response = await fetch(`https://pokeapi.co/api/v2/move/${move}`);
    if (response.ok) {
      const data = await response.json();
      fetchedMoves.push({ id: data.id, name: data.name });
    } else {
      console.warn(`Move "${move}" not able to be taught.`);
    }
  }

  if (fetchedMoves.length === 0) {
    return res.status(400).json({ error: 'No valid moves found from the provided input.' });
  }

  const currentMoves = pokemon.moves || [];
  const updatedMoves = [...currentMoves, ...fetchedMoves].slice(-4);

  pokemon.moves = updatedMoves;

  return res.status(200).json({
    id: pokemon.id,
    caughtPokemonId: pokemon.caughtPokemonId,
    name: pokemon.name,
    moves: updatedMoves,
    height: pokemon.height,
    weight: pokemon.weight,
    stats: pokemon.stats,
  });
});


app.put('/pokemon/evolve/:caughtPokemonId', async (req, res) => {
  console.log('PUT /pokemon/evolve/:caughtPokemonId request received.', req.params);
  
  const caughtPokemonId = req.params.caughtPokemonId;
  const pokemon = CAUGHT_POKEMON.find(p => p.caughtPokemonId === caughtPokemonId);

  if (!pokemon) {
    res.status(400).send(`Invalid caughtPokemonId: ${caughtPokemonId}`);
  }

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`);
  if (!response.ok) {
    return res.status(400).json({ error: `Unable to retrieve Pokémon data for id: ${pokemon.id}` });
  }

  const speciesData = await response.json();
  const evolutionChainUrl = speciesData.evolution_chain.url;

  const evolutionResponse = await fetch(evolutionChainUrl);
  if (!evolutionResponse.ok) {
    return res.status(400).json({ error: 'Unable to retrieve evolution chain.' });
  }

  const evolutionData = await evolutionResponse.json();
  let currentSpecies = evolutionData.chain;

  while (currentSpecies && currentSpecies.species.name !== speciesData.name) {
    currentSpecies = currentSpecies.evolves_to[0];
  }

  if (!currentSpecies || currentSpecies.evolves_to.length === 0) {
    return res.status(400).json({ error: `${pokemon.name} cannot evolve further.` });
  }

  const nextEvolution = currentSpecies.evolves_to[0].species;

  const nextPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${nextEvolution.name}`);
  if (!nextPokemonResponse.ok) {
    return res.status(400).json({ error: 'Unable to retrieve evolved Pokémon details.' });
  }

  const nextPokemonData = await nextPokemonResponse.json();

  pokemon.name = nextPokemonData.name;
  pokemon.id = nextPokemonData.id;

  res.status(200).json({
      id: pokemon.id,
      caughtPokemonId: pokemon.caughtPokemonId,
      name: pokemon.name,
      moves: pokemon.moves,
      height: nextPokemonData.height,
      weight: nextPokemonData.weight,
      stats: pokemon.stats,
  });
});


app.post('/pokemon/breed-check', async (req, res) => {
  console.log('POST /pokemon/breed-check request received.', req.body);

  const breedPokemon = req.body;
  
  if (!Array.isArray(breedPokemon) || breedPokemon.length !== 2) {
    return res.status(400).json({ error: 'Invalid pokemon input. Provide an array of 2 Pokemon.' });
  }

  const pokemon1 = breedPokemon[0];
  const pokemon2 = breedPokemon[1];

  const pokemon1Response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon1}`);
  if (!pokemon1Response.ok) {
    return res.status(400).json({ error: `Invalid Pokémon: ${pokemon1}` });
  }
  const pokemon1Data = await pokemon1Response.json();

  const pokemon2Response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon2}`);
  if (!pokemon2Response.ok) {
    return res.status(400).json({ error: `Invalid Pokémon: ${pokemon2}` });
  }
  const pokemon2Data = await pokemon2Response.json();

  const pokemon1EggGroups = pokemon1Data.egg_groups.map(group => group.name);
  const pokemon2EggGroups = pokemon2Data.egg_groups.map(group => group.name);

  const breedable = pokemon1EggGroups.some(group => pokemon2EggGroups.includes(group));

  res.status(200).json(breedable);
});


app.get('/item/buy/:id', async (req, res) => {
  const itemInput = req.params.id;

  const itemResponse = await fetch(`https://pokeapi.co/api/v2/item/${itemInput}`);
  if (!itemResponse.ok) {
    return res.status(400).json({ error: `Invalid item: ${itemInput}` });
  }

  const itemData = await itemResponse.json();
  const item = {
    id: itemData.id,
    name: itemData.name,
    cost: itemData.cost,
  };

  if (bag.length >= 10) {
    return res.status(500).json({ error: 'Bag is full. Cannot add more items.' });
  }

  bag.push(item);
  res.status(200).json(bag);
});


app.get('/bag', (req, res) => {
  res.status(200).json({ bag });
});


app.delete('/bag', (req, res) => {
  bag = [];
  res.status(200).json("Bag emptied!");
});


app.listen(PORT, () => {
  console.log(`ExpressJS server listening on port ${PORT}`);
  console.log(CAUGHT_POKEMON);
})