import { StacksProvider } from '@stacks/connect';

import { BRANCH, COMMIT_SHA } from '@shared/environment';
import {
  AuthenticationRequestEventDetails,
  DomEventName,
  ProfileUpdateRequestEventDetails,
  SignatureRequestEventDetails,
  TransactionRequestEventDetails,
} from '@shared/inpage-types';
import {
  AuthenticationResponseMessage,
  ExternalMethods,
  LegacyMessageToContentScript,
  MESSAGE_SOURCE,
  ProfileUpdateResponseMessage,
  SignatureResponseMessage,
  TransactionResponseMessage,
} from '@shared/message-types';

type CallableMethods = keyof typeof ExternalMethods;

interface ExtensionResponse {
  source: 'blockstack-extension';
  method: CallableMethods;

  [key: string]: any;
}

const callAndReceive = async (
  methodName: CallableMethods | 'getURL',
  opts: any = {}
): Promise<ExtensionResponse> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject('Unable to get response from Blockstack extension');
    }, 1000);
    const waitForResponse = (event: MessageEvent) => {
      if (
        event.data.source === 'blockstack-extension' &&
        event.data.method === `${methodName}Response`
      ) {
        clearTimeout(timeout);
        window.removeEventListener('message', waitForResponse);
        resolve(event.data);
      }
    };
    window.addEventListener('message', waitForResponse);
    window.postMessage(
      {
        method: methodName,
        source: 'blockstack-app',
        ...opts,
      },
      window.location.origin
    );
  });
};

const isValidEvent = (event: MessageEvent, method: LegacyMessageToContentScript['method']) => {
  const { data } = event;
  const correctSource = data.source === MESSAGE_SOURCE;
  const correctMethod = data.method === method;
  return correctSource && correctMethod && !!data.payload;
};

const provider: StacksProvider = {
  getURL: async () => {
    const { url } = await callAndReceive('getURL');
    return url;
  },
  structuredDataSignatureRequest: async signatureRequest => {
    const event = new CustomEvent<SignatureRequestEventDetails>(
      DomEventName.structuredDataSignatureRequest,
      {
        detail: { signatureRequest },
      }
    );
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<SignatureResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.signatureResponse)) return;
        if (event.data.payload?.signatureRequest !== signatureRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.signatureResponse === 'cancel') {
          reject(event.data.payload.signatureResponse);
          return;
        }
        if (typeof event.data.payload.signatureResponse !== 'string') {
          resolve(event.data.payload.signatureResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },
  signatureRequest: async signatureRequest => {
    const event = new CustomEvent<SignatureRequestEventDetails>(DomEventName.signatureRequest, {
      detail: { signatureRequest },
    });
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<SignatureResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.signatureResponse)) return;
        if (event.data.payload?.signatureRequest !== signatureRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.signatureResponse === 'cancel') {
          reject(event.data.payload.signatureResponse);
          return;
        }
        if (typeof event.data.payload.signatureResponse !== 'string') {
          resolve(event.data.payload.signatureResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },
  authenticationRequest: async authenticationRequest => {
    const event = new CustomEvent<AuthenticationRequestEventDetails>(
      DomEventName.authenticationRequest,
      {
        detail: { authenticationRequest },
      }
    );
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<AuthenticationResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.authenticationResponse)) return;
        if (event.data.payload?.authenticationRequest !== authenticationRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.authenticationResponse === 'cancel') {
          reject(event.data.payload.authenticationResponse);
          return;
        }
        resolve(event.data.payload.authenticationResponse);
      };
      window.addEventListener('message', handleMessage);
    });
  },
  transactionRequest: async transactionRequest => {
    const event = new CustomEvent<TransactionRequestEventDetails>(DomEventName.transactionRequest, {
      detail: { transactionRequest },
    });
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<TransactionResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.transactionResponse)) return;
        if (event.data.payload?.transactionRequest !== transactionRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.transactionResponse === 'cancel') {
          reject(event.data.payload.transactionResponse);
          return;
        }
        if (typeof event.data.payload.transactionResponse !== 'string') {
          resolve(event.data.payload.transactionResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },
  profileUpdateRequest: async profileUpdateRequest => {
    const event = new CustomEvent<ProfileUpdateRequestEventDetails>(
      DomEventName.profileUpdateRequest,
      {
        detail: { profileUpdateRequest },
      }
    );
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<ProfileUpdateResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.profileUpdateResponse)) return;
        if (event.data.payload?.profileUpdateRequest !== profileUpdateRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.profileUpdateResponse === 'cancel') {
          reject(event.data.payload.profileUpdateResponse);
          return;
        }
        if (typeof event.data.payload.profileUpdateResponse !== 'string') {
          resolve(event.data.payload.profileUpdateResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },
  getProductInfo() {
    return {
      version: VERSION,
      name: 'Hiro Wallet for Web',
      meta: {
        tag: BRANCH,
        commit: COMMIT_SHA,
      },
    };
  },
  request: function (_method: string): Promise<Record<string, any>> {
    throw new Error('`request` function is not implemented');
  },
};

window.StacksProvider = provider;
