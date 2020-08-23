import Header from 'components/Header';

import withApollo from 'lib/withApollo';
import withRedux from 'lib/withRedux';

import { useQuery } from '@apollo/client';

import { getPosts } from 'graphql/query/posts';

const Index = () => {
  const { data, loading, error } = useQuery(getPosts, { ssr: true });

  if (loading || error) {
    return <div>Loading</div>;
  }

  console.log(data.posts);

  return (
    <div>
      <Header />
      <div>hello index</div>
      <div>
        {data.posts.map((v) => (
          <h1>{v.title}</h1>
        ))}
      </div>
    </div>
  );
};

export default withApollo(Index);
