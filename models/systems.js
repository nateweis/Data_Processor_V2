const db = require('../db/db_connection');

const getSystems = (req, res) => {
    db.any('SELECT * FROM systems')
    .then(data => res.json({message: "retrieve systems success", pulledData: data, status: 200}))
    .catch(err => res.json({message: "didnt retrive stysems ERR", err, status: 402}))
}

const addSystem = (req, res) => {
    db.none('INSERT INTO systems(id, name, company, contacts, address) VALUES(${id}, ${name}, ${company}, ${contacts}, ${address})', req.body)
    .then(() => res.json({message: "added system succesfull", status: 200}))
    .catch(err => res.json({message: "didnt update stysems ERR", err, status: 402}))
}

module.exports = {
    getSystems,
    addSystem
}