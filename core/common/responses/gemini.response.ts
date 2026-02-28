export const geminiResponses = {
  config: {
    apiKeyNotSet: {
      code: 2000001,
      status: false,
      message: 'GEMINI_API_KEY is not set in environment variables.',
    },
    modelNotSet: {
      code: 2000002,
      status: false,
      message: 'GEMINI_MODEL is not set in environment variables.',
    },
  },
  generateContent: {
    invalidContent: {
      code: 2000100,
      status: false,
      message: 'Content must be a non-empty string.',
    },
    error: {
      code: 2000199,
      status: false,
      message: 'Failed to generate content with Gemini API.',
    },
    success: {
      code: 2010100,
      status: true,
      message: 'Content has been successfully generated.',
    },
  },
  generateContentStream: {
    invalidContent: {
      code: 2000200,
      status: false,
      message: 'Content must be a non-empty string.',
    },
    error: {
      code: 2000299,
      status: false,
      message: 'Failed to stream content from Gemini API.',
    },
    success: {
      code: 2010200,
      status: true,
      message: 'Content stream has been successfully started.',
    },
  },
};
