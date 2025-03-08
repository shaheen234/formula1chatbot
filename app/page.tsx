"use client"
import Image from "next/image"
import F1logo from "./assets/f1logo.png"
import {useChat} from "ai/react"
import { Message } from "ai"
import Bubble from "./components/Bubble"
import PromptSuggestionRow from "./components/PromptSuggestionRow"
import LoadingBubble from "./components/LoadingBubble"

// import background from "./assets/background.jpeg"
const Home =()=>{
    
    const {append,input,isLoading,messages,handleInputChange,handleSubmit}=useChat()
    const noMessages=!messages || messages.length===0
    const handlePrompt=(promptText)=>{
        const msg: Message={
            id: crypto.randomUUID(),
            content:promptText,
            role:"user"
        }
        append(msg)
    }
    return (
        <main>
            <Image src={F1logo} width="250" alt="F1GPT Logo"/>
            <section className={noMessages ? "":"populated"}>
                {noMessages ?(
                    <>
                    <p className="starter-text">
                    The ultimate place for Formula1 superfans,
                    Ask F1GPT anything about the topics of F1 racing and it will come back with the up-to-date answers.
                    </p>
                    <br></br>
                    <PromptSuggestionRow onPromptClick={handlePrompt}/>

                </>
                ):(
                    <>
                    {messages.map((message,index)=><Bubble key={`message-${index}`} message={message}/>)}
                    {isLoading && <LoadingBubble/>}
                    </>
                )}
               
            </section>
            <form onSubmit={handleSubmit}>
                    <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something.."></input>
                    
                    <input type="submit"></input>

                </form>

            
        </main>
    )

}

export default Home