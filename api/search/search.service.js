import 'dotenv/config'
import { logger } from '../../services/logger.service.js'

const BASE_URL = 'https://api.spotify.com/v1/'
const SONG_QUERY_LIMIT = 10

export const spotifyService = { search }
const defaultSearchContents = ['track', 'album', 'artist']

async function _getAccessToken() {
    logger.info('Fetching spotify API token')
    const endpoint = `https://accounts.spotify.com/api/token?grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        if (!res.ok)
            throw new Error(`Bad response: ${res.status} - ${res.statusText}`)
        const body = await res.json()
        process.env.ACCESS_TOKEN = 'Bearer ' + body.access_token
        return 'Bearer ' + body.access_token
    } catch (err) {
        logger.error('Cannot get Spotify access token', err)
        throw err
    }
}

// Can add limit
async function search(searchString, contentTypeList = defaultSearchContents) {
    if (!Array.isArray(contentTypeList))
        throw new Error(
            'Cannpt search spotify - passed content types are not a list'
        )
    let endpoint =
        BASE_URL +
        `search?q=${encodeURI(searchString)}&limit=${SONG_QUERY_LIMIT}`
    if (contentTypeList.length > 0)
        endpoint += '&type=' + contentTypeList.join(',')
    try {
        const accessToken = process.env.ACCESS_TOKEN
            ? process.env.ACCESS_TOKEN
            : await _getAccessToken()
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: accessToken,
            },
        })
        const body = await res.json()
        return {
            tracks: body.tracks.items.map((track) => _formatSong(track)),
            albums: body.albums.items,
            artists: body.artists.items,
        }
    } catch (err) {
        logger.error('Failed searching Spotify', err)
        throw err
    }
}

// Can extend support to save,link full album data (spotify ID, name)
// Images is an array of 3 images - from large to big
function _formatSong(song) {
    const { album, artists, name, id, duration_ms, images } = song
    return {
        spotifyId: id,
        title: name,
        album: album.name,
        genre: '',
        artists: artists.map((artist) => artist.name),
        imgUrl: album.images[0].url,
        duration: duration_ms,
    }
}
