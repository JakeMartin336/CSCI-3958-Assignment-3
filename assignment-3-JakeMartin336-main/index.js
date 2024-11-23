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

// *Hint: use uuidv4 to generate a random ID
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
    return res.status(400).json({
      error: `Invalid Pokémon ID or name: ${pokemonId}`,
    });
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
    return res.status(400).json({
      error: 'Request body must contain a non-empty array of Pokémon IDs or names.',
    });
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
    return res.status(400).json({ error: `Invalid caughtPokemonId: ${caughtPokemonId}` });
  }

  const currentMoves = pokemon.moves || [];
  const structuredCurrentMoves = currentMoves.map(move => {
    return typeof move === 'object' ? move : { id: move, name: `move-${move}` }; // Placeholder name for legacy moves
  });
  const structuredNewMoves = newMoves.map(move => {
    return typeof move === 'object' ? move : { id: move, name: `move-${move}` }; // Placeholder name for new moves
  });
  const updatedMoves = [...structuredCurrentMoves, ...structuredNewMoves].slice(-4);
  pokemon.moves = updatedMoves;
  res.status(200).json({
    id: pokemon.id,
    caughtPokemonId: pokemon.caughtPokemonId,
    name: pokemon.name,
    moves: updatedMoves,
    height: pokemon.height,
    weight: pokemon.weight,
    stats: pokemon.stats,
  });
});




app.listen(PORT, () => {
  console.log(`ExpressJS server listening on port ${PORT}`);
  console.log(CAUGHT_POKEMON);
})