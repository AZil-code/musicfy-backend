import express from 'express'
import {
    fetchCategory,
    fetchPlaylist,
    fetchYtbId,
    searchGenres,
    searchSpotify,
} from './search.controller.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getSpotifyBearerToken } from '../../middlewares/bearerTokenFetch.middleware.js'

const router = express.Router()

router.get('/spotify', log, getSpotifyBearerToken, searchSpotify)

router.get(
    '/spotify/playlist/:playlistId',
    log,
    getSpotifyBearerToken,
    fetchPlaylist
)

router.get('/spotify/genre', log, getSpotifyBearerToken, searchGenres)

router.get('/youtube', log, fetchYtbId)

router.get('/', log, fetchCategory)

export const searchRoutes = router
