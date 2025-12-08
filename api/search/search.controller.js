import { spotifyService } from './search.service.js'

export async function searchSpotify(req, res) {
    const { q } = req.query
    try {
        const results = await spotifyService.search(q)
        console.log(results.tracks)
        res.json(results.tracks)
    } catch (err) {}
}
