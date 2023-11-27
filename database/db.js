const mysql = require('mysql2/promise');
const path = require('path');
const dbPath = path.join(__dirname,'pokebase.db');
const crypto = require('crypto');
const fs = require('fs');


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Password1234',
    database: 'pokebase'
  });
  async function savePokemonToDatabase(pokemonList) {
    let conn;
    try {
      conn = await connection;
  
      await conn.beginTransaction();
  
      const stmt = 'INSERT INTO pokemon (PokemonID, Type, Basic, Breedable) VALUES (?, ?, ?, ?)';
        
      for (const pokemon of pokemonList) {
        console.log("For loop ")
        const { id, name, Basic, Unbreedable, spriteblob } = pokemon;
        const basicInt = Basic ? 1 : 0;
        const breedableInt = Unbreedable ? 0 : 1;
          
        // Insert the raw Blob data directly
        await conn.execute(stmt, [id, name, basicInt, breedableInt]);

      }
  
      await conn.commit();
      return 'Pokémon saved to the database.';
    } catch (error) {
      if (conn) {
        await conn.rollback();
      }
      throw error;
    }
  }
  
  
  async function getPokemonImageFromDB(pokemonID) {
    let conn;
    try {
      // Assuming you have established a connection named `connection` to your MySQL database
      conn = await connection;
      // Fetch the Pokémon sprite Blob from the database
      const query = 'SELECT Sprite FROM Pokemon WHERE PokemonID = ?';
      const [rows, fields] = await conn.execute(query, [pokemonID]);
  
      if (rows.length > 0) {
        const spriteBlob = rows[0].Sprite;
  
        // Save the Blob data as an image file (assuming the Blob contains image data)
        fs.writeFileSync(`pokemon_${pokemonID}.png`, spriteBlob);
  
        return `Image saved as pokemon_${pokemonID}.png`;
      } else {
        return 'Pokémon not found in the database';
      }
    } catch (error) {
      throw error;
    }
  }
  
  
  module.exports = {
    savePokemonToDatabase,
    getPokemonImageFromDB
  };