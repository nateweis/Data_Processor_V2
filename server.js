const express = require("express")
const cors = require("cors")
const app = express(); 

const port = process.env.PORT || 3005;

// middleware
app.use(cors())
app.use(express.json());
app.use(express.static('public'));

// controllers 
const dataController = require('./controllers/dataRoutes');
app.use('/data', dataController)

const systController = require('./controllers/systemRoutes');
app.use('/system', systController);


// port listener 
app.listen(port, () => {
    console.log(`The Data Processing App is running on: ${port}`);
  });