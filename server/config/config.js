require("dotenv").config();
// ============================
//  Port BY Default
// ============================
process.env.PORT = process.env.PORT || 3000;

// ============================
//  Enviroment
// ============================
process.env.NODE_ENV = process.env.NODE_ENV || "dev";

// ============================
//  Database
// ============================
let urlDB;

if (process.env.ENVIROMENT === 'dev' || process.env.ENVIROMENT === 'local') {
    console.log("Develop MODE ");
    //urlDB = 'mongodb://localhost:27017/timugoClientApp';
    urlDB =process.env.MONGO_URL_TEST;
} else {
    console.log("production mode");
    urlDB = process.env.MONGO_URL;
}

process.env.URLDB = urlDB;
// ============================
//  Token Expiration
// ============================
process.env.TOKEN_EXPIRATION = 60 * 60 * 24 * 30;

// ============================
//  seed of the token
// ============================

process.env.TOKEN_SEED = process.env.TOKEN_SEED || "tokenSeed";
