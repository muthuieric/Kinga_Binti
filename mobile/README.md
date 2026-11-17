# Kinga Binti Mobile (React Native / Expo SDK 58)

Mobile client for the Kinga Binti FastAPI backend. Web-matching UI (colors/theme), consent-gated narrative capture + NLP analysis, English→Maa translation, archive, and corpus stats.

## Run (mobile + backend)
```bash
# Terminal 1 — backend (reachable on LAN for device)
cd ~/Downloads/NLP_Maa/Kinga_Binti
source backend/venv/bin/activate 2>/dev/null || source venv/bin/activate 2>/dev/null || true
export PYTHONPATH="$PWD:$PWD/backend"
HOST=0.0.0.0 PORT=8000 python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
```bash
# Terminal 2 — mobile (Expo SDK 58)
cd ~/Downloads/NLP_Maa/Kinga_Binti/mobile
npm install          # first time / after clean
npx expo start -c    # scan QR with Expo Go (SDK 58)
```

## Backend URL (important for "offline/failed to connect")
- Set `expo.extra.apiBaseUrl` in `app.json` to your PC LAN IP (e.g. `http://192.168.x.x:8000`) for a physical device; **restart Expo with `-c`** after changes.
- Android emulator: `http://10.0.2.2:8000`. iOS simulator: `http://localhost:8000`.
- Backend must run on `0.0.0.0:8000`, phone and PC on same Wi‑Fi, and firewall must allow port 8000. Test: open `http://<PC-IP>:8000/api/health` in the phone browser.

## Capabilities
- **Home:** backend connectivity/status, web-style hero/roles and trust info.
- **Capture:** English/Swahili/Maa narrative, consent gate, submit to `/api/narratives/submit`, shows prediction/confidence/stance/markers.
- **Translate:** English→Maa via `/api/translate` (draft aid; may take 30–120s on CPU first load; review by Maa speaker).
- **Archive:** lists `/api/narratives`.
- **Stats:** shows `/api/stats` (totals, language/category/sub-county/stance).

## Stack & config
- Expo SDK 58, React Native 0.88, React 19, React Navigation (tabs), New Architecture enabled.
- Theming: `src/theme.ts` (web-matched palette), branded header with shuka stripe.
- API client: `src/api/client.ts` (timeouts, clear network errors). App config: `app.json`.
