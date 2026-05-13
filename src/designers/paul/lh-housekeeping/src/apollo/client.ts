import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: 'https://sm-native-5c5b643660da.herokuapp.com/graphql',
  cache: new InMemoryCache(),
});
