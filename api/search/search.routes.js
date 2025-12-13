import express from 'express'
import {
    fetchCategories,
    fetchYtbId,
    searchSpotify,
} from './search.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

const router = express.Router()

router.get('/spotify', log, searchSpotify)

router.get('/youtube', log, fetchYtbId)

router.get('/', log, fetchCategories)

export const searchRoutes = router
