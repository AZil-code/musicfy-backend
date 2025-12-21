import 'dotenv/config'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

const SPOTIFY_URL = 'https://api.spotify.com/v1/'
const YTB_URL = 'https://www.googleapis.com/youtube/v3'
const SONG_QUERY_LIMIT = 10

export const searchService = {
    searchSpotify,
    searchPlaylist,
    searchYtb,
    getCategories,
    getAccessToken,
}
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
    { contentTypeList = defaultSearchContents, limit = SONG_QUERY_LIMIT }
) {
    if (!Array.isArray(contentTypeList))
        throw new Error(
            'Cannot search spotify - passed content types are not a list'
        )
    let endpoint =
        SPOTIFY_URL + `search?q=${encodeURI(searchString)}&limit=${limit}`
    if (contentTypeList.length > 0)
        endpoint += '&type=' + contentTypeList.join(',')
    try {
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: process.env.ACCESS_TOKEN,
            },
        })
        if (!res.ok) {
            throw new Error(
                `Bad response from Spotify: ${res.status} - ${res.statusText}`
            )
        }
        const body = await res.json()
        const tracksArr =
            body && body.tracks && Array.isArray(body.tracks.items)
                ? body.tracks.items
                : []
        const albumsArr =
            body && body.albums && Array.isArray(body.albums.items)
                ? body.albums.items.filter((album) => album != null)
                : []
        const artistsArr =
            body && body.artists && Array.isArray(body.artists.items)
                ? body.artists.items
                : []
        const playlistsArr =
            body && body.playlists && Array.isArray(body.playlists.items)
                ? body.playlists.items.filter((playlist) => playlist != null)
                : []

        return {
            tracks: tracksArr.map((track) => _formatSong(track)),
            albums: albumsArr.map((album) => _formatStation(album, 'album')),
            artists: artistsArr,
            playlists: playlistsArr.map((playlist) => _formatStation(playlist)),
        }
    } catch (err) {
        logger.error('Failed searching Spotify', err)
        throw err
    }
}

async function searchPlaylist(playlistSpotifyId) {
    if (!playlistSpotifyId) throw new Error('Invalid spotify ID')
    const endpoint = SPOTIFY_URL + `playlists/${playlistSpotifyId}`
    try {
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: process.env.ACCESS_TOKEN,
            },
        })
        if (!res.ok) {
            throw new Error(
                `Bad response from Spotify: ${res.status} - ${res.statusText}`
            )
        }
        const body = await res.json()
        body.items = await _searchPlaylistSongs(playlistSpotifyId)
        return _formatStation(body)
    } catch (err) {
        logger.error('Failed searching playlist in Spotify', err)
        throw err
    }
}

async function _searchPlaylistSongs(playlistSpotifyId) {
    if (!playlistSpotifyId) throw new Error('Invalid spotify ID')
    const endpoint = SPOTIFY_URL + `playlists/${playlistSpotifyId}/tracks`
    try {
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: process.env.ACCESS_TOKEN,
            },
        })
        if (!res.ok) {
            throw new Error(
                `Bad response from Spotify: ${res.status} - ${res.statusText}`
            )
        }
        const body = await res.json()
        return body.items
    } catch (err) {
        logger.error('Failed searching playlist in Spotify', err)
        throw err
    }
}

async function getCategories() {
    try {
        const collection = await dbService.getCollection('category')
        const categories = await collection.find()
        return categories.toArray()
    } catch (err) {
        logger.error('Cannot find categories', err)
        throw err
    }
}

async function getAccessToken() {
    logger.info('Fetching spotify API token')
    const endpoint = `https://accounts.spotify.com/api/token`
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64'
    )
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        })
        if (!res.ok)
            throw new Error(`Bad response: ${res.status} - ${res.statusText}`)
        const body = await res.json()
        process.env.ACCESS_TOKEN = 'Bearer ' + body.access_token
        return 'Bearer ' + body.access_token
    } catch (err) {
        console.log(err)
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
        artists: artists.map((artist) => ({ name: artist.name })),
        imgUrl: album.images[0].url,
        duration: Math.round((duration_ms || 0) / 1000), // seconds to match frontend expectation
    }
}

// type - album, playlist
function _formatStation(station, type = 'playlist') {
    const { id, name, description, images, owner, items } = station
    return {
        name,
        spotifyId: id,
        description,
        coverImage: images[0].url,
        // tags,
        createdBy:
            type === 'playlist'
                ? {
                      _id: owner._id,
                      username: owner.display_name,
                      // imgUrl: 'https://misc.scdn.co/liked-songs/playlist-announcement-image.jpg',
                  }
                : null,
        isLikedSongsPlaylist: false,
        isPrivate: false,
        type: type,
        songs: items ? items.map((song) => _formatSong(song.track)) : null,
    }
}
