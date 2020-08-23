import fetch from 'isomorphic-fetch';
import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

let apolloClient = null;

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch;
}

const { SPACE_GRAPHQL_ENGINE_HOSTNAME } = publicRuntimeConfig;

const GRAPHQL_ENDPOINT = `http://${SPACE_GRAPHQL_ENGINE_HOSTNAME}/v1/api/archisketch/graphql`;
const WEBSOCKET_ENDPOINT = `ws://${SPACE_GRAPHQL_ENGINE_HOSTNAME}/v1/api/archisketch/graphql/socket`;

function create(initialState, { getToken }) {
  const authLink = setContext((_, { headers }) => {
    const token = getToken();
    // if token is null get data for anonymous
    if (!token) return null;
    // if token is exist get data for user authentication
    return {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    };
  });
  const wsLink = process.browser
    ? new WebSocketLink({
        uri: WEBSOCKET_ENDPOINT,
        options: {
          lazy: true,
          reconnect: true,
        },
      })
    : null;

  const httpLink = createHttpLink({
    uri: GRAPHQL_ENDPOINT,
  });

  const link = process.browser
    ? split(
        ({ query }) => {
          const { kind, operation } = getMainDefinition(query);
          return kind === 'OperationDefinition' && operation === 'subscription';
        },
        wsLink,
        httpLink
      )
    : httpLink;

  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser,
    link: authLink.concat(link),
    cache: new InMemoryCache({ addTypename: false }).restore(initialState || {}),
  });
}

function initApollo(initialState, options) {
  if (!process.browser) {
    return create(initialState, options);
  }

  if (!apolloClient) {
    apolloClient = create(initialState, options);
  }

  return apolloClient;
}

export default initApollo;
