import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import {
    getStations,
    getStationById,
    addStation,
    updateStation,
    removeStation,
} from './station.controller.js'
import { getSpotifyBearerToken } from '../../middlewares/bearerTokenFetch.middleware.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getStations)
router.get('/:id', log, getSpotifyBearerToken, getStationById)
router.post('/', log, requireAuth, addStation)
// router.post('/', log, addStation)
router.put('/:id', requireAuth, updateStation)
// router.put('/:id', updateStation)
router.delete('/:id', requireAuth, removeStation)
// router.delete('/:id', removeStation)
router.delete('/:id', requireAuth, removeStation)
// router.delete('/:id', removeStation)

export const stationRoutes = router
