import express from "express";
import { TracksController } from "../controllers/tracksController";

const trackRoute = express.Router();


const tracksController : TracksController = new TracksController()

/**
 * GET /tracks/:trackId
 */
trackRoute.get('/:trackId', (req, res) => tracksController.getTrack(req, res));

/**
 * POST all tracks from ./tracks/songs folder into songs table
 */
trackRoute.post('/folder/songs', (req, res) => tracksController.uploadSongsFromFolder(req, res))

/**
 * POST all tracks from ./tracks/links folder into links table
 */
trackRoute.post('/folder/links', (req, res) => tracksController.uploadLinksFromFolder(req, res))

/**
 * GET all tracks /tracks
 */
trackRoute.get('/', (req, res) => tracksController.listAllTracks(req, res));


export default trackRoute;

