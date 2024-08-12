import express from 'express';
import { Stream } from '../controllers/streamController';

const streamRoute = express.Router();

const stream = new Stream()

streamRoute.get('/health', (req, res) => {
    return res.json({
        status: 'healthy'
    })
})

streamRoute.get('/:blendId', (req, res) => stream.process(req, res))


export default streamRoute;