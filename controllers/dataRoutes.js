const express = require('express')
const router = express.Router();
const Data = require('../models/data')

router.post('/', Data.saveData)
router.get('/', Data.getData)

module.exports = router