import { ApolloClient, InMemoryCache } from '@apollo/client';
import { Platform } from 'react-native';

// On web (deployed or local dev), use a relative path — same origin, no CORS needed.
// On native (Expo Go), point to the local dev server.
// On native production, point to the deployed Heroku app.
const GRAPHQL_URI =
  Platform.OS === 'web'
    ? '/graphql'
    : __DEV__
      ? 'http://localhost:8080/graphql'
      : 'https://sm-native-5c5b643660da.herokuapp.com/graphql';

export const client = new ApolloClient({
  uri: GRAPHQL_URI,
  cache: new InMemoryCache(),
});
