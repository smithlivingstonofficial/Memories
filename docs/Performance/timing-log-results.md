# Timing Log Results

| Route | Total measured queries | Slowest query | Total measured time | Notes |
| --- | ---: | --- | --- | --- |
| `/home` | Not collected live | Not collected live | Not collected live | Build passed; requires authenticated browser session to collect console logs |
| `/vault` | Not collected live | Not collected live | Not collected live | Build passed; private route needs login |
| `/messages` | Not collected live | Not collected live | Not collected live | RPC logs will appear after SQL is applied; fallback warns if RPC is missing |
| `/profile` | Not collected live | Not collected live | Not collected live | Build passed; private route needs login |
| `/discover` | Not collected live | Not collected live | Not collected live | Build passed; private route needs login |

`npm run build` passed. `npm run start` was attempted as a smoke check, but the command stayed attached and hit the tool timeout before route testing could be completed. No secrets were printed by the timing helper; it logs labels and milliseconds only.
