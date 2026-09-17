<div align="center" id="top">

# Spotify Manager

</div>
<p align="center">
  <img alt="Top language" src="https://img.shields.io/github/languages/top/YourPOV/Spotify-Manager?color=56BEB8">
  <img alt="Language count" src="https://img.shields.io/github/languages/count/YourPOV/Spotify-Manager?color=56BEB8">
  <img alt="Repository size" src="https://img.shields.io/github/repo-size/YourPOV/Spotify-Manager?color=56BEB8">
  <img alt="License" src="https://img.shields.io/github/license/YourPOV/Spotify-Manager?color=56BEB8">
</p>

---

app for managing spotify playlists


## Features

- create and delete playlists
- search for tracks across spotify
- manage playlist visibility (public/private)
- spotify oauth login flow

## Stack

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

## Install

```bash
git clone https://github.com/YourPOV/Spotify-Manager.git
cd Spotify-Manager
npm install
```

set up a spotify app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard). create an app, grab your client id/secret, and add `http://127.0.0.1:9876/callback` to redirect URIs.

setup `.env` and fill it out:

```bash
cp .env.example .env
```

## Build

dev server:
```bash
npm run dev
```

production build:
```bash
npm run build
```

preview production build:
```bash
npm run preview
```

output goes to `dist/`

## Contact

- Portfolio: [yourpov.dev](https://yourpov.dev)

## License

MIT
