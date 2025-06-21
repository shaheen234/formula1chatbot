// app/page.tsx
"use client"
import Image from "next/image"
import F1logo from "./assets/f1logo.png"
import { useChat } from "@ai-sdk/react" // Keep useChat for input/form handling
import { Message } from "ai" // Keep Message type
import Bubble from "./components/Bubble"
import PromptSuggestionRow from "./components/PromptSuggestionRow"
import LoadingBubble from "./components/LoadingBubble"
import { useState } from "react" // Import useState

const Home = () => {
    // Manually manage messages state
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Manually manage isLoading

    // Use useChat for input state and change handling
    const { input, handleInputChange, setInput } = useChat(); // Removed append, messages, isLoading, handleSubmit from here

    // Custom handleSubmit function to manage messages and API call
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevent default form submission

        if (!input.trim()) return; // Don't send empty messages

        const userMessage: Message = {
            id: new Date().getTime().toString(), // Unique ID for the message
            role: 'user',
            content: input,
            createdAt: new Date(),
        };

        // Add user message to state
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput(''); // Clear input box

        setIsLoading(true); // Set loading state

        try {
            // Manually make the API call
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the user's new message along with previous messages if needed by your API
                // For simplicity, we'll just send the current user message for this iteration
                // If your backend needs the full chat history, you'd send `messages` + `userMessage`
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
            }

            // Parse the JSON response
            const assistantMessageData: Message = await response.json();

            // Add assistant message to state
            setMessages((prevMessages) => [...prevMessages, assistantMessageData]);

        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally, add an error message to the chat
            setMessages((prevMessages) => [...prevMessages, {
                id: new Date().getTime().toString(),
                role: 'assistant',
                content: `Error: Could not get a response. Please try again.`,
                createdAt: new Date(),
            }]);
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    // Custom handlePrompt function to add user prompt and trigger API call
    const handlePrompt = async (promptText: string) => {
        const userMessage: Message = {
            id: new Date().getTime().toString(),
            role: "user",
            content: promptText,
            createdAt: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] }), // Send full history
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
            }

            const assistantMessageData: Message = await response.json();

            console.log('Assistant data received by frontend:', assistantMessageData); // ADD THIS LINE
            setMessages((prevMessages) => [...prevMessages, assistantMessageData]);

        } catch (error) {
            console.error('Error sending prompt:', error);
            setMessages((prevMessages) => [...prevMessages, {
                id: new Date().getTime().toString(),
                role: 'assistant',
                content: `Error: Could not get a response. Please try again.`,
                createdAt: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };


    const noMessages = messages.length === 0;

    console.log('messages', messages); // Keep this log for comparison

    return (
        <main>
            <Image src={F1logo} width="250" alt="F1GPT Logo" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The ultimate place for Formula1 superfans,
                            Ask F1GPT anything about the topics of F1 racing and it will come back with the up-to-date answers.
                        </p>
                        <br></br>
                        <PromptSuggestionRow onPromptClick={handlePrompt} />

                    </>
                ) : (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        {messages.map((message, index) => (
                            <Bubble key={message.id || index} message={message} />
                        ))}
                        {isLoading && <LoadingBubble />}
                    </div>
                )}

            </section>
            <form onSubmit={handleSubmit}>
                <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something.."></input>

                <input type="submit"></input>

            </form>


        </main>
    )

}

export default Home;