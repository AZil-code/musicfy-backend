import express from 'express'
import { fetchYtbId, searchSpotify, searchSpotifyAllResults, getPlaylistSongs, getAlbumSongs} from './search.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

const router = express.Router()

router.get('/spotifyFull', log, searchSpotifyAllResults)

router.get('/spotify', log, searchSpotify)

router.get('/youtube', log, fetchYtbId)

router.get('/playlist/:id', log, getPlaylistSongs)
router.get('/album/:id', log, getAlbumSongs)

export const searchRoutes = router
