var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const { database, savePokemonToDatabase,getPokemonImageFromDB } = require('./database/db');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

async function fetchPokemonFromLists() {
  try {
    const list1 = await fetch('https://pokeapi.co/api/v2/pokedex/32/');
    const data1 = await list1.json();
    const list2 = await fetch('https://pokeapi.co/api/v2/pokedex/31/');
    const data2 = await list2.json();

    const allPokemon = [...data1.pokemon_entries, ...data2.pokemon_entries];
  
    const extractedData = allPokemon.map(entry => {
      return {
        name: entry.pokemon_species.name,
        id: entry.pokemon_species.url.split('/').filter(Boolean).pop()
      };
    });
     // set sikre ingen duplikeringer 
    const uniqueSet = new Set(extractedData.map(pokemon => JSON.stringify(pokemon)));
    //tilbage til et array fra et set nu uden duplikeringer
    const uniqueExtractedData = Array.from(uniqueSet).map(pokemonString => JSON.parse(pokemonString));
    
    
    return uniqueExtractedData;
  } catch (error) {
    console.error('Error fetching Pokémon:', error);  
    throw error;
  }
}

async function findBreedableBasic(pokemonList) {
    const updatedPokemonList = await Promise.all(
      //for hver pokemon
      pokemonList.map(async pokemon => {
        try {
          //Hent siden
          const pokemonDetails = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}/`);
          //converter fra json til object
          const PokemonInfo = await pokemonDetails.json();
          //tjek om den er med i no-eggs gruppen. sætter unbreedable til false som std og true hvis den er i no-eggs
          const isUnbreedable = PokemonInfo.egg_groups.some(group => group.name === 'no-eggs');
          //sætter isBasic true hvis evolves_from_spieces er null
          const isBasic = PokemonInfo.evolves_from_species === null;
        
          return {
            ...pokemon,
            Unbreedable: isUnbreedable,
            Basic: isBasic
          };
        } catch (error) {
          console.error(`Error processing details for ${pokemon.name}:`, error);
          return pokemon;
        }
      })
    );
    return updatedPokemonList; 
  }
  async function getSprites(pokemonList) {
    try {
      const updatedPokemonList = await Promise.all(
        pokemonList.map(async pokemon => {
          try {
            const pokemonDetails = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}/`);
            const PokemonInfo = await pokemonDetails.json();
  
            const spriteUrl = PokemonInfo.sprites.front_default;
  
            if (spriteUrl) {
              const response = await fetch(spriteUrl);
              const blob = await response.blob();
  
              return {
                ...pokemon,
                spriteblob: blob // Store blob URL
              };
            } else {
              return pokemon;
            }
          } catch (error) {
            console.error(`Error processing details for ${pokemon.name}:`, error);
            return pokemon;
          }
        })
      );
      return updatedPokemonList;
    } catch (error) {
      console.error('Error fetching Pokémon:', error);
      throw error;
    }
  }
  

  async function main() {
    try {
      const pokemonList = await fetchPokemonFromLists();
      const processedPokemonList = await findBreedableBasic(pokemonList);
      const pokeListWithBlobs = await getSprites(processedPokemonList);
      //console.log(pokeListWithBlobs);
      savePokemonToDatabase(pokeListWithBlobs)
      .then(() => {
        console.log('Pokémon data saved successfully!');
      })
    
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
  
  main();
  
  /*getPokemonImageFromDB(57)
  .then(result => console.log(result))
  .catch(error => console.error('Error:', error)); */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
