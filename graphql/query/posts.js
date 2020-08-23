import { gql } from '@apollo/client';

export const getPosts = gql`
  query {
    posts @mongo {
      id
      title
      description
      status
      createdAt
      updatedAt
    }
  }
`;
