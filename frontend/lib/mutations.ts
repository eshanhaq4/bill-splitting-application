import { gql } from 'graphql-request';

export const UPLOAD_RECEIPT = gql`
  mutation UploadReceipt($sessionId: ID!, $fileBase64: String!, $fileName: String!) {
    uploadReceipt(sessionId: $sessionId, fileBase64: $fileBase64, fileName: $fileName) {
      success
      errorCode
      message
    }
  }
`;

export const CREATE_SESSION = gql`
  mutation CreateSession($displayName: String!, $dietaryPreference: String!) {
    createSession(displayName: $displayName, dietaryPreference: $dietaryPreference) {
      success
      token
      member {
        id
      }
      session {
        id
      }
    }
  }
`;

export const JOIN_SESSION = gql`
  mutation JoinSession($sessionId: ID!, $displayName: String!, $dietaryPreference: String!) {
    joinSession(sessionId: $sessionId, displayName: $displayName, dietaryPreference: $dietaryPreference) {
      session {
        id
      }
      member {
        id
        token
      }
      errorCode
      message
    }
  }
`;

export const GET_SESSION = gql`
  query GetSession($id: ID!) {
    session(id: $id) {
      id
      tax
      tip
      qrCodeUrl
      members {
        id
        displayName
        connected
      }
      items {
        id
        name
        price
        category
        locked
        claimedBy {
          id
          displayName
          connected
        }
      }
    }
  }
`;

export const CLAIM_ITEM = gql`
  mutation ClaimItem($itemId: ID!, $userId: ID!) {
    claimItem(itemId: $itemId, userId: $userId) {
      success
      errorCode
      message
    }
  }
`;

export const RELEASE_ITEM = gql`
  mutation ReleaseItem($itemId: ID!, $userId: ID!) {
    releaseItem(itemId: $itemId, userId: $userId) {
      success
      errorCode
      message
    }
  }
`;