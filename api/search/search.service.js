import 'dotenv/config'
import { logger } from '../../services/logger.service.js'

const SPOTIFY_URL = 'https://api.spotify.com/v1/'
const YTB_URL = 'https://www.googleapis.com/youtube/v3'
const SONG_QUERY_LIMIT = 10

export const searchService = { searchSpotify, searchYtb }
const defaultSearchContents = ['track', 'album', 'artist']

async function searchYtb(songName) {

    console.log('searching YT')
    const type = 'video'
    const part = 'snippet'
    const endpoint = `${YTB_URL}/search?key=${process.env.YTB_API_KEY}&type=${type}&part=${part}&q=${songName}&maxResults=1`
    try {
        const res = await fetch(endpoint, { method: 'GET' })

        if (!res.ok)
            throw new Error(
                `Bad status code! ${res.status} - ${res.statusText}`
            )
        const data = await res.json()
        return data.items[0].id.videoId
    } catch (err) {
        logger.error('Failed searching Youtube', err)
        throw err
    }
}

// Can add limit
async function searchSpotify(
    searchString,
    contentTypeList = defaultSearchContents
) {
    if (!Array.isArray(contentTypeList))
        throw new Error(
            'Cannot search spotify - passed content types are not a list'
        )
    let endpoint =
        SPOTIFY_URL +
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
        if (!res.ok) {
            throw new Error(`Bad response from Spotify: ${res.status} - ${res.statusText}`)
        }
        const body = await res.json()
        const tracksArr = (body && body.tracks && Array.isArray(body.tracks.items)) ? body.tracks.items : []
        const albumsArr = (body && body.albums && Array.isArray(body.albums.items)) ? body.albums.items : []
        const artistsArr = (body && body.artists && Array.isArray(body.artists.items)) ? body.artists.items : []
        return {
            tracks: tracksArr.map((track) => _formatSong(track)),
            albums: albumsArr,
            artists: artistsArr,
        }
    } catch (err) {
        logger.error('Failed searching Spotify', err)
        throw err
    }
}

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

// Can extend support to save,link full album data (spotify ID, name)
// Images is an array of 3 images - from large to big
function _formatSong(song) {
    const { album, artists, name, id, duration_ms, images } = song
    return {
        spotifyId: id,
        title: name,
        album: album.name,
        genre: '',
        artists: artists.map((artist) => ({name: artist.name})),
        imgUrl: album.images[0].url,
        duration: Math.round((duration_ms || 0) / 1000), // seconds to match frontend expectation
    }
}
