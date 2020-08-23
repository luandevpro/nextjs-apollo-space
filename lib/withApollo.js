import React from 'react';
import Head from 'next/head';
import PropTypes from 'prop-types';
import { getDataFromTree, renderToStringWithData } from '@apollo/client/react/ssr';
import { ApolloProvider } from '@apollo/client';
import Router from 'next/router';
import { redirectPages } from 'commons/index';

import * as actions from 'actions/user';
import initApollo from 'lib/initApollo';
// import { customers } from 'graphql/query/user';

let globalUser = null;
let globalToken = null;

function getCookie(context = {}) {
  return context.req && context.req.signedCookies.token ? context.req.signedCookies.token : globalToken;
}

const withApollo = (App, { loginRequired = true, logoutRequired = false } = {}) => {
  class Apollo extends React.Component {
    static propTypes = {
      user: PropTypes.shape({
        id: PropTypes.string,
        isAdmin: PropTypes.bool,
      }),
      isFromServer: PropTypes.bool.isRequired,
      token: PropTypes.string.isRequired,
    };

    static defaultProps = {
      user: null,
    };

    constructor(props) {
      super(props);
      this.apolloClient = initApollo(props.apolloState, {
        getToken: () => getCookie(),
      });
    }

    // auth client

    componentDidMount() {
      const { user, isFromServer, token } = this.props;
      if (isFromServer) {
        globalUser = user;
        globalToken = token;
      }
      if (loginRequired && !logoutRequired && !globalUser && !!globalUser === true) {
        Router.push('/login');
      }
      if (logoutRequired && !!globalUser === true) {
        Router.push('/');
      }
    }

    render() {
      return (
        <ApolloProvider client={this.apolloClient}>
          <App user={this.state?.user} {...this.props} apolloClient={this.apolloClient} />
        </ApolloProvider>
      );
    }
  }

  Apollo.getInitialProps = async (ctx) => {
    const { Component, router } = ctx;

    // Run all GraphQL queries in the component tree
    // and extract the resulting data
    const apollo = initApollo(
      {},
      {
        getToken: () => getCookie(ctx),
      }
    );

    // check request from server
    const isFromServer = !!ctx.req;
    // currentUser
    let user = null;

    // get currentUser if login for client vs server
    if (ctx.req && ctx.req.signedCookies?.token) {
      try {
        // const { data } = await apollo.query({
        //   query: customers,
        // });
        // user = ctx.req && ctx.req.signedCookies.token ? data.customers[0] : globalUser;
        // const currentUser = { ...data.customers[0], token: ctx.req.signedCookies.token };
        // ctx.reduxStore.dispatch(actions.getCurrentUser(currentUser));
      } catch (e) {
        console.log(e, 'err');
      }
    } else {
      user = globalUser;
    }

    // get token from server vs client
    const token = ctx.req && ctx.req.signedCookies?.token ? ctx.req.signedCookies?.token : globalToken;
    const appProps = { isFromServer, user, token };

    if (App.getInitialProps) {
      Object.assign(appProps, (await App.getInitialProps(ctx, apollo)) || {});
    }

    if (!token && ctx && redirectPages(ctx.pathname)) {
      ctx.res.writeHead(302, { Location: `/login` });
      ctx.res.end();
    }

    const url = {
      ctx: ctx.asPath,
      pathname: ctx.pathname,
      query: ctx.query,
    };

    if (!process.browser) {
      if (ctx.res && ctx.res.finished) {
        return {};
      }
      if (
        ctx.req
        // && ctx.req.signedCookies.token
      ) {
        try {
          await getDataFromTree(
            <ApolloProvider ctx={ctx} {...appProps} client={apollo}>
              <App
                user={user}
                ctx={ctx}
                {...appProps}
                url={url}
                Component={Component}
                router={router}
                apolloClient={apollo}
              />
            </ApolloProvider>
          );
        } catch (error) {
          console.error('getMarkupFromTree');
        }
      }
      // getDataFromTree does not call componentWillUnmount
      // head side effect therefore need to be cleared manually
      Head.rewind();
    }

    const apolloState = apollo.cache.extract();

    return {
      ...appProps,
      apolloState,
      url,
    };
  };

  //   Set the correct displayName in development
  if (process.env.NODE_ENV !== 'production') {
    const displayName = App.displayName || App.name || 'Component';

    if (displayName === 'MyApp') {
      console.warn('This withApollo HOC only works with App.');
    }

    Apollo.displayName = `withApollo(${displayName})`;
  }

  Apollo.propTypes = {
    apolloState: PropTypes.object, //eslint-disable-line
  };

  return Apollo;
};

export default withApollo;
