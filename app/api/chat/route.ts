import { LangChainAdapter } from 'ai'
import { DataAPIClient } from "@datastax/astra-db-ts"
import { HfInference } from "@huggingface/inference"

const {ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    HUGGINGFACE_API_KEY
    }=process.env
    const hf = new HfInference(HUGGINGFACE_API_KEY || "")

    const client= new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
    const db=client.db(ASTRA_DB_API_ENDPOINT,{namespace:ASTRA_DB_NAMESPACE})
    export async function POST(req:Request) {
        try{
            const {messages}=await req.json()
            const latestmessages= messages[messages?.length-1]?.content
            let docContext=""
            const embedding = await hf.featureExtraction({
                model: "sentence-transformers/all-MiniLM-L6-v2", // ✅ 384-dimension embeddings
                inputs: latestmessages
            })
                try{
                    const collection=await db.collection(ASTRA_DB_COLLECTION)
                    const cursor = await collection.insertOne({
                        $vector: embedding, // Replace with actual embedding vector
                        text: latestmessages,
                    
                    })
                    const insertedDoc = await collection.findOne({ _id: cursor.insertedId })
                    const docContext = JSON.stringify(insertedDoc?.text)
                }
                catch (err){
                    console.log("error in db...")
                    docContext=""
                }
                const template={
                    role:'system',
                    content: `You are an AI assistant who knows everything about Formula One.
                    Use the below context to augment what you know about Formula One racing.
                    The context will provide you with the most recent page data from Wikipedia,
                    the official F1 website and others.
                    If the context doesn't include the information you need answer based on your
                    existing knowledge and don't mention the source of your information or
                    what the context does or doesn't include.
                    Format responses using markdown where applicable and don't return images.
                    
                    ---------------
                    START CONTEXT
                    ${docContext}
                    END CONTEXT
                    ---------------
                    QUESTION:${latestmessages}
                    --------------- `
                    }
                    const response = await fetch("https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct"
, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                          "Content-Type": "application/json",
                          // If the endpoint supports SSE:
                          Accept: "text/event-stream"
                        },
                        body: JSON.stringify({
                        template: template,
                        inputs: latestmessages,
                        // stream:true,
                        limit:3
                          // sometimes also { parameters: { stream: true } }
                        })
                      })
                      
                      console.log(response)
                      
    
                      const textStream = response.body!.pipeThrough(new TextDecoderStream())
                      return LangChainAdapter.toDataStreamResponse(textStream) 



        }
        catch(err){
            console.log(err)
        }
    }
        
    