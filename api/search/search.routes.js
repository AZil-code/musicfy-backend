import express from 'express'
import {
    fetchCategories,
    fetchYtbId,
    searchPlaylists,
    searchSpotify,
} from './search.controller.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getSpotifyBearerToken } from '../../middlewares/bearerTokenFetch.middleware.js'

const router = express.Router()

router.get('/spotify', log, getSpotifyBearerToken, searchSpotify)

router.get('/youtube', log, fetchYtbId)

router.get('/', log, fetchCategories)

router.get('/genre', log, getSpotifyBearerToken, searchPlaylists)

export const searchRoutes = router
