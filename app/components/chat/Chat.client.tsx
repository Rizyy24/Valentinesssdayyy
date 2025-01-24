import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimate } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import debounce from 'lodash/debounce';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { useShortcuts } from '~/lib/hooks/useShortcuts';
import { PROMPT_COOKIE_KEY, DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import type { TokenUsage } from '~/types/token-usage';
import type { ProviderInfo } from '~/types/model';
import { BaseChat } from './BaseChat';

const processSampledMessages = (options: {
  messages: any[];
  initialMessages: any[];
  isLoading: boolean;
  parseMessages: (_messages: any[], _isLoading: boolean) => void;
  storeMessageHistory: (_messages: any[]) => Promise<void>;
}) => {
  const { messages, initialMessages, isLoading, parseMessages, storeMessageHistory } = options;
  parseMessages(messages, isLoading);

  if (messages.length > initialMessages.length) {
    storeMessageHistory(messages).catch((error) => toast.error(error.message));
  }
};

interface ChatProps {
  initialMessages: any[];
  storeMessageHistory: (_messages: any[]) => Promise<void>;
  importChat: (_description: string, _messages: any[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

export function Chat() {
  const { ready, initialMessages, storeMessageHistory, importChat, exportChat } = {
    ready: true,
    initialMessages: [],
    storeMessageHistory: async (_messages: any[]) => {
      /* Placeholder function - implementation provided by parent component */
    },
    importChat: async (_description: string, _messages: any[]) => {
      /* Placeholder function - implementation provided by parent component */
    },
    exportChat: () => {
      /* Placeholder function - implementation provided by parent component */
    },
  };
  const title = '';

  return (
    <>
      {ready && (
        <ChatImpl
          description={title}
          initialMessages={initialMessages}
          exportChat={exportChat}
          storeMessageHistory={storeMessageHistory}
          importChat={importChat}
        />
      )}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          {/* Toasts will be rendered here */}
        </div>
      </div>
    </>
  );
}

export const ChatImpl = memo(
  ({ description, initialMessages, storeMessageHistory, importChat, exportChat }: ChatProps) => {
    useShortcuts();

    const { enhancingPrompt } = {
      enhancingPrompt: false,
    };

    const { parseMessages } = {
      parseMessages: (_messages: any[], _isLoading: boolean) => {
        /* Placeholder function - actual implementation not needed in this context */
      },
    };
    const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    const { messages, input, isLoading, append, stop, setInput } = {
      messages: [],
      input: '',
      isLoading: false,
      append: async (_message: any) => {
        /* Placeholder function - actual implementation provided by chat hook */
      },
      stop: () => {
        /* Placeholder function - actual implementation provided by chat hook */
      },
      setInput: (_input: string) => {
        /* Placeholder function - actual implementation provided by chat hook */
      },
    };

    useEffect(() => {
      chatStore.setKey('started', initialMessages.length > 0);

      // Reset token count when starting a new chat
      if (messages.length === 0) {
        const emptyUsage: TokenUsage = {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          stats: {
            input: { characterCount: 0, tokenCount: 0, inputCost: 0 },
            output: { characterCount: 0, tokenCount: 0, outputCost: 0 },
          },
        };

        // Update the chat store with empty usage
        chatStore.setKey('tokens', emptyUsage);
      }
    }, [messages, initialMessages]);

    useEffect(() => {
      processSampledMessages({
        messages,
        initialMessages,
        isLoading,
        parseMessages,
        storeMessageHistory,
      });
    }, [messages, isLoading, parseMessages]);

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [imageDataList, setImageDataList] = useState<string[]>([]);
    const [searchParams] = useState<[URLSearchParams, (value: URLSearchParams) => void]>([
      new URLSearchParams(),
      () => {
        /* Placeholder function - actual implementation not needed in this context */
      },
    ]);

    const [model, setModel] = useState(() => {
      const savedModel = Cookies.get('selectedModel');
      return savedModel || DEFAULT_MODEL;
    });

    const [provider, setProvider] = useState(() => {
      const savedProvider = Cookies.get('selectedProvider');
      return (PROVIDER_LIST.find((p: { name: string }) => p.name === savedProvider) ||
        DEFAULT_PROVIDER) as ProviderInfo;
    });

    const [animationScope, animate] = useAnimate();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleModelChange = (newModel: string) => {
      setModel(newModel);
      Cookies.set('selectedModel', newModel, { expires: 30 });
    };

    const handleProviderChange = (newProvider: ProviderInfo) => {
      setProvider(newProvider);
      Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
    };

    const scrollTextArea = () => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    };

    const abort = () => {
      stop();
      chatStore.setKey('aborted', true);
      workbenchStore.abortAllActions();
    };

    const runAnimation = async () => {
      if (chatStarted) {
        return;
      }

      await animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 });

      setChatStarted(true);
    };

    const sendMessage = async (_event: any, messageInput?: string) => {
      const input = messageInput || '';

      if (!input.trim() && !uploadedFiles.length) {
        return;
      }

      runAnimation();

      if (uploadedFiles.length > 0 && imageDataList.length > 0) {
        // Send message with both text and images
        await append({
          role: 'user',
          content: JSON.stringify([
            { type: 'text', text: input },
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ]),
        });

        /**
         * Clear the uploaded files and image data after sending
         */
        setUploadedFiles([]);
        setImageDataList([]);
      } else if (imageDataList.length > 0) {
        // Send message with only images
        await append({
          role: 'user',
          content: JSON.stringify([
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ]),
        });
      } else {
        // Send message with only text
        await append({
          role: 'user',
          content: JSON.stringify([{ type: 'text', text: input }]),
        });
      }

      setInput('');
      scrollTextArea();
    };

    const onTextareaChange = (event: any) => {
      setInput(event.target.value);
    };

    const debouncedCachePrompt = useMemo(
      () =>
        debounce((value: string) => {
          const trimmedValue = value.trim();

          if (trimmedValue) {
            Cookies.set(PROMPT_COOKIE_KEY, trimmedValue, { expires: 30 });
          } else {
            Cookies.remove(PROMPT_COOKIE_KEY);
          }
        }, 1000),
      [],
    );

    useEffect(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.style.height = 'auto';

        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
        textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
      }
    }, [input, textareaRef]);

    useEffect(() => {
      const prompt = searchParams[0].get('prompt');

      if (prompt) {
        searchParams[1](new URLSearchParams());
        runAnimation();
        append({
          role: 'user',
          content: JSON.stringify([
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${prompt}`,
            },
          ]),
        });
      }
    }, [model, provider, searchParams]);

    const messageRef = useCallback((_node: HTMLDivElement | null) => {
      /* Ref callback implementation - actual implementation not needed in this context */
    }, []);

    const scrollRef = useCallback((_node: HTMLDivElement | null) => {
      /* Ref callback implementation - actual implementation not needed in this context */
    }, []);

    return (
      <BaseChat
        ref={animationScope}
        textareaRef={textareaRef}
        input={input}
        messages={messages}
        chatStarted={chatStarted}
        isStreaming={isLoading}
        model={model}
        setModel={handleModelChange}
        provider={provider}
        setProvider={handleProviderChange}
        providerList={PROVIDER_LIST as ProviderInfo[]}
        messageRef={messageRef}
        scrollRef={scrollRef}
        handleInputChange={(e) => {
          onTextareaChange(e);
          debouncedCachePrompt(e.target.value);
        }}
        handleStop={abort}
        sendMessage={sendMessage}
        enhancingPrompt={enhancingPrompt}
        promptEnhanced={false}
        enhancePrompt={() => {
          /* Placeholder function - actual implementation not needed in this context */
        }}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        imageDataList={imageDataList}
        setImageDataList={setImageDataList}
        actionAlert={useStore(workbenchStore.alert)}
        clearAlert={() => workbenchStore.clearAlert()}
        importChat={importChat}
        exportChat={exportChat}
        description={description}
      />
    );
  },
);
