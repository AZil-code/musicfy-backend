import { searchService } from './search.service.js'

export async function searchSpotify(req, res) {
    const { q } = req.query
    try {
        const results = await searchService.searchSpotify(q, {
            contentTypeList: ['track', 'album', 'artist'],
        })
        res.json(results.tracks)
    } catch (err) {
        throw err
    }
}

export async function searchGenres(req, res) {
    const { q } = req.query
    try {
        const results = await searchService.searchSpotify(q, {
            // contentTypeList: ['playlist'],
            contentTypeList: ['playlist', 'album'],
            limit: 10,
        })
        res.json(results)
    } catch (err) {
        throw err
    }
}

export async function fetchPlaylist(req, res) {
    try {
        const { playlistId } = req.params
        const playlist = await searchService.searchPlaylist(playlistId)
        res.json(playlist)
    } catch (err) {
        console.log(err)
        res.status(400).send('Bad Request')
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

export async function fetchCategory(req, res) {
    try {
        const categories = await searchService.getCategories()
        res.json(categories)
    } catch (err) {
        throw err
    }
}
