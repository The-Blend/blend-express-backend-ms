import express from 'express';
import trackRoute from './routes/tracks';
import { bucket, connectToMongoDB, db } from './middlewares/mongo';
import bodyParser from "body-parser"; 
import streamRoute from './routes/stream';
import cors from 'cors'

const app = express();
const port = process.env.PORT || 7007;

const server = require('http').Server(app)

// Middleware to connect to MongoDB before handling requests
app.use(async (req, res, next) => {
    if (!db || !bucket) {
        await connectToMongoDB();
    }
    next();
});

const options = {
    origin: 'http://localhost:3000',
}
app.use(cors(options))
app.use(bodyParser.json());

app.use('/stream', streamRoute)
// app.use('/tracks', trackRoute);
  
app.get('/', (req, res) => {
    res.send('Hello World!');
});

server.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});