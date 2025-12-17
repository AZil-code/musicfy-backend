import 'dotenv'
import { searchService } from '../api/search/search.service.js'

export async function getSpotifyBearerToken(req, res, next) {
    if (!process.env.ACCESS_TOKEN) {
        await searchService.getAccessToken()
    }
    next()
}
