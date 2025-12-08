import { searchService } from './search.service.js'

export async function searchSpotify(req, res) {
    const { q } = req.query
    try {
        const results = await searchService.searchSpotify(q)
        res.json(results.tracks)
    } catch (err) {
        throw err
    }
}

export async function fetchYtbId(req, res) {
    const { q: songName } = req.query
    try {
        const ytbId = await searchService.searchYtb(songName)
        res.json({ ytbId })
    } catch (err) {
        throw err
    }
}
