import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ErrorIcon } from './icons';

interface GeminiResponseProps {
    loading: boolean;
    error: string;
    response: string;
    isStreaming?: boolean;
}

const GeminiResponse: React.FC<GeminiResponseProps> = ({ loading, error, response, isStreaming = false }) => {
    if (loading && !isStreaming) {
        return (
            <div className="mt-4 p-4 bg-fito-bg rounded-lg flex items-center justify-center min-h-[100px]">
                <div className="w-8 h-8 border-4 border-fito-green border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg" role="alert">
                <ErrorIcon className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
            </div>
        );
    }

    if (!response) {
        return null;
    }

    return (
        <div className={`prose prose-invert prose-sm sm:prose-base max-w-none ${!isStreaming ? 'mt-4 p-4 bg-fito-bg rounded-lg border border-fito-border' : ''}`}>
             <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-fito-green hover:underline" />,
                    h1: ({node, ...props}) => <h1 {...props} className="text-white" />,
                    h2: ({node, ...props}) => <h2 {...props} className="text-white" />,
                    h3: ({node, ...props}) => <h3 {...props} className="text-white" />,
                    pre: ({node, ...props}) => <pre {...props} className="bg-fito-bg-light !p-3 rounded-md" />,
                    code: ({node, ...props}) => <code {...props} className="bg-fito-panel rounded px-1 py-0.5 text-fito-text before:content-[''] after:content-['']" />,
                }}
            >
                {response}
            </ReactMarkdown>
            {!isStreaming && <p className="text-xs text-fito-text-dark mt-4 pt-2 border-t border-fito-border">Powered by Gemini</p>}
        </div>
    );
};

export default GeminiResponse;
