const axios = require('axios');

class NvidiaAPI {
  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY;
    this.baseURL = process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    this.llmModel = process.env.NVIDIA_LLM_MODEL || 'meta/llama-3.1-70b-instruct';
    this.embeddingModel = process.env.NVIDIA_EMBEDDING_MODEL || 'nvidia/nv-embed-v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ NVIDIA_API_KEY not found in environment variables');
    }

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds
    });
  }

  /**
   * Generate text completion using NVIDIA LLM
   */
  async generateCompletion(prompt, systemPrompt = null, options = {}) {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await this.client.post('/chat/completions', {
        model: this.llmModel,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        top_p: options.topP || 0.9
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from NVIDIA API');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error generating completion:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid NVIDIA API key');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate embeddings using NVIDIA embedding model
   */
  async generateEmbedding(text) {
    try {
      const response = await this.client.post('/embeddings', {
        model: this.embeddingModel,
        input: text,
        input_type: 'passage',
        encoding_format: 'float'
      });

      if (!response.data?.data?.[0]?.embedding) {
        throw new Error('Invalid embedding response from NVIDIA API');
      }

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('❌ Error generating embedding:', error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid NVIDIA API key');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey !== 'your_nvidia_api_key_here';
  }
}

module.exports = new NvidiaAPI();