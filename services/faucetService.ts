import { API_BASE_URL } from '../constants';

interface FaucetSuccessResponse {
  txHash: string;
}

interface FaucetErrorResponse {
  message: string;
}

interface CaptchaQuestionResponse {
  question: string;
}

export const getCaptchaQuestion = async (): Promise<string> => {
  console.log('Requesting CAPTCHA question from backend.');
  const fetchURL = `/api/captcha-question`;
  const response = await fetch(fetchURL);
  const data: CaptchaQuestionResponse | FaucetErrorResponse = await response.json();

  if (!response.ok) {
    const errorMessage = (data as FaucetErrorResponse).message || 'An unknown server error occurred.';
    throw new Error(errorMessage);
  }

  return (data as CaptchaQuestionResponse).question;
};

export const requestTokens = async (address: string, question: string, userAnswer: string): Promise<FaucetSuccessResponse> => {
  console.log(`Requesting tokens for ${address} from backend.`);

  // Use a relative path, which works for both local dev proxy and Vercel rewrites.
  const fetchURL = `/api/request-tokens`;

  const response = await fetch(fetchURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, question, userAnswer }),
  });

  const data: FaucetSuccessResponse | FaucetErrorResponse = await response.json();

  if (!response.ok) {
    const errorMessage = (data as FaucetErrorResponse).message || 'An unknown server error occurred.';
    throw new Error(errorMessage);
  }

  return data as FaucetSuccessResponse;
};
