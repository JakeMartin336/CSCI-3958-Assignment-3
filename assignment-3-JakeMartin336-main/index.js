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

app.get('/pokemon/:id', (req, res) => {
  console.log('GET /pokemon/:id request received.', req.params);
  res.send('200 Response for GET /pokemon/:id');
})

app.post('/pokemon/catch', (req, res) => {
  console.log('POST /pokemon/catch request received.', req.body);
  res.send('200 Response for POST /pokemon/catch');
})

app.listen(PORT, () => {
  console.log(`ExpressJS server listening on port ${PORT}`);
})