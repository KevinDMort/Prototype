const mysql = require('mysql2/promise');
const path = require('path');
const dbPath = path.join(__dirname,'pokebase.db');
const crypto = require('crypto');


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Password1234',
    database: 'pokebase'
  });
  async function blobFromUrl(blobUrl) {
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch Blob from URL');
      }
      const blob = await response.blob();
      return blob;
    } catch (error) {
      throw new Error(`Error fetching Blob: ${error.message}`);
    }
  }
  async function savePokemonToDatabase(pokemonList) {
    return new Promise(async (resolve, reject) => {
      let conn;
      try {
        conn = await connection;
        await conn.beginTransaction();
  
        const stmt = 'INSERT INTO Pokemon (PokemonID, Type, Basic, Breedable, Sprite) VALUES (?, ?, ?, ?, ?)';
  
        for (const pokemon of pokemonList) {
          const { id, name, Basic, Unbreedable, spriteblob } = pokemon;
          const basicInt = Basic ? 1 : 0;
          const breedableInt = Unbreedable ? 0 : 1;
            
          await conn.execute(stmt, [id, name, basicInt, breedableInt, {set: spriteblob}]);
        }
  
        await conn.commit();
        resolve('Pokémon saved to the database.');
      } catch (error) {
        if (conn) {
          await conn.query('ROLLBACK');
        }
        reject(error);
      }
    });
  }
  
  
  
  module.exports = {
    savePokemonToDatabase
  };