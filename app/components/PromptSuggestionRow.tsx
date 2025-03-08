import PromptSuggestionButton from "./PromptSuggestionButton"
const PromptSuggestionRow =({onPromptClick})=>{
    const prompt=[
        "Who is the highest paid F1 driver?",
        "Who will drive Ferrari?",
        "Who is currently F1 driver's champion?"
    ]
    return(
        <div className="prompt-suggestion-row">
            {prompt.map((prompt,index)=><PromptSuggestionButton 
            key={`suggestion-${index}`}
            text={prompt}
            onClick= {() => {onPromptClick(prompt)}}
            />)}
        </div>
    )
}
export default PromptSuggestionRow