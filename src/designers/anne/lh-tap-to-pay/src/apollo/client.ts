import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const GRAPHQL_URI = 'https://sm-native-5c5b643660da.herokuapp.com/graphql';

// Local-dev only: the deployed site sits behind HTTP Basic auth, and that gate
// runs before /graphql (see server.js). In production the app is served from the
// same origin, so the browser supplies the credentials automatically and these
// vars are unset. For local preview, run the native app (Expo Go fetch isn't
// subject to CORS) with the site credentials in the shell, e.g.:
//   EXPO_PUBLIC_BASIC_USER=xxx EXPO_PUBLIC_BASIC_PASS=yyy npm run dev:native
const BASIC_USER = process.env.EXPO_PUBLIC_BASIC_USER;
const BASIC_PASS = process.env.EXPO_PUBLIC_BASIC_PASS;

// Hermes doesn't reliably expose a global btoa, so encode base64 ourselves.
const toBase64 = (str: string): string => {
  if (typeof btoa === 'function') return btoa(str);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i);
    const b = i + 1 < str.length ? str.charCodeAt(i + 1) : NaN;
    const c = i + 2 < str.length ? str.charCodeAt(i + 2) : NaN;
    const e2 = ((a & 3) << 4) | (isNaN(b) ? 0 : b >> 4);
    const e3 = isNaN(b) ? 64 : ((b & 15) << 2) | (isNaN(c) ? 0 : c >> 6);
    const e4 = isNaN(c) ? 64 : c & 63;
    out += chars[a >> 2] + chars[e2] + (e3 === 64 ? '=' : chars[e3]) + (e4 === 64 ? '=' : chars[e4]);
  }
  return out;
};

const authHeaders =
  BASIC_USER && BASIC_PASS
    ? { Authorization: `Basic ${toBase64(`${BASIC_USER}:${BASIC_PASS}`)}` }
    : {};

export const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URI, headers: authHeaders }),
  cache: new InMemoryCache(),
});
