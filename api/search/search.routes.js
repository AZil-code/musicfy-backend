import express from 'express'
import { searchSpotify } from './search.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

const router = express.Router()

router.get('/', log, searchSpotify)

export const searchRoutes = router
