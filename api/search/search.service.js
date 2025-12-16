import 'dotenv/config'
import { logger } from '../../services/logger.service.js'

const SPOTIFY_URL = 'https://api.spotify.com/v1/'
const YTB_URL = 'https://www.googleapis.com/youtube/v3'
const SONG_QUERY_LIMIT = 10

export const searchService = { searchSpotify, searchYtb, getPlaylistSongs, getAlbumSongs }
const defaultSearchContents = ['track', 'album', 'artist', 'playlist']

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
        const playlistsArr = (body && body.playlists && Array.isArray(body.playlists.items)) ? body.playlists.items : []

        return {
            tracks: tracksArr.map((track) => _formatSong(track)),
            albums: albumsArr,
            artists: artistsArr,
            playlists: playlistsArr.filter( (playlist) => playlist !== null)
        }
    } catch (err) {
        logger.error('Failed searching Spotify', err)
        throw err
    }
}

async function getPlaylistSongs(playlistId){
    try {
        const endpoint = SPOTIFY_URL + `playlists/${encodeURI(playlistId)}`
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

        const songs = Array.isArray(body.tracks?.items)
            ? body.tracks.items
                .map((item) => {
                    if (!item || !item.track) return null
                    return _formatSong(item.track)
                })
                .filter(Boolean)
            : []

        return { songs, playlist: body }

    } catch (err) {
            logger.error('Failed searching Spotify', err)
            throw err
    }
}

async function getAlbumSongs(albumId) {
    try {
        const endpoint = SPOTIFY_URL + `albums/${encodeURI(albumId)}`
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

        const albumBody = await res.json()
        const tracks = Array.isArray(albumBody.tracks?.items) ? albumBody.tracks.items : []

        const songs = tracks
            .map((track) => {
                if (!track) return null
                // Ensure album data exists for formatter (album endpoint tracks omit images sometimes)
                const trackWithAlbum = { ...track, album: albumBody }
                return _formatSong(trackWithAlbum)
            })
            .filter(Boolean)

        return { songs, album: albumBody }
    } catch (err) {
        logger.error('Failed fetching album songs', err)
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

    if (!song) return

    const normalizedSong = song.track || song
    const { album, artists, name, id, duration_ms } = normalizedSong

    const albumName = album && album.name ? album.name : ''
    const albumImages = album && Array.isArray(album.images) ? album.images : []
    const primaryImage = albumImages.length
        ? albumImages[0].url
        : (Array.isArray(normalizedSong.images) && normalizedSong.images[0]?.url) || null
    const artistList = Array.isArray(artists) ? artists.map((artist) => ({ name: artist.name || '' })) : []
    const durationSec = Math.round((Number(duration_ms) || 0) / 1000)

    return {
        _id: id,
        spotifyId: id,
        title: name || normalizedSong.title || '',
        album: albumName,
        genre: '',
        artists: artistList,
        imgUrl: primaryImage,
        duration: durationSec, // seconds to match frontend expectation
    }
}
