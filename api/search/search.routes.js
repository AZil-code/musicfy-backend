import express from 'express'
import { fetchYtbId, searchSpotify } from './search.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

const router = express.Router()

router.get('/spotify', log, searchSpotify)

router.get('/youtube', log, fetchYtbId)

export const searchRoutes = router
