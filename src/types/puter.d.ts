// Puter.js Type Declarations
// https://docs.puter.com/

interface PuterAITool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, any>;
            required?: string[];
        };
        strict?: boolean;
    };
}

interface PuterAIChatOptions {
    model?: string;
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
    tools?: PuterAITool[];
}

interface PuterToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

interface PuterChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: PuterToolCall[];
    tool_call_id?: string;
}

interface PuterChatResponse {
    message: PuterChatMessage;
    toString(): string;
}

interface PuterAI {
    chat(prompt: string | PuterChatMessage[], options?: PuterAIChatOptions): Promise<PuterChatResponse>;
    chat(prompt: string, imageUrl: string, options?: PuterAIChatOptions): Promise<PuterChatResponse>;
    listModels(): Promise<string[]>;
}

interface Puter {
    ai: PuterAI;
    print(text: string): void;
    randName(): string;
}

declare global {
    interface Window {
        puter: Puter;
    }
    const puter: Puter;
}

export { };
