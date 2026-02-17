export const geminiResponses = {
  config: {
    apiKeyNotSet: {
      code: 200001,
      status: false,
      message: 'GEMINI_API_KEY is not set in environment variables.',
    },
    modelNotSet: {
      code: 200002,
      status: false,
      message: 'GEMINI_MODEL is not set in environment variables.',
    },
  },
  generateContent: {
    invalidContent: {
      code: 200100,
      status: false,
      message: 'Content must be a non-empty string.',
    },
    error: {
      code: 200199,
      status: false,
      message: 'Failed to generate content with Gemini API.',
    },
    success: {
      code: 210100,
      status: true,
      message: 'Content has been successfully generated.',
    },
  },
  generateContentStream: {
    invalidContent: {
      code: 200200,
      status: false,
      message: 'Content must be a non-empty string.',
    },
    error: {
      code: 200299,
      status: false,
      message: 'Failed to stream content from Gemini API.',
    },
    success: {
      code: 210200,
      status: true,
      message: 'Content stream has been successfully started.',
    },
  },
};
