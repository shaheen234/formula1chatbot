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
            // Embedding generation using Hugging Face API (correct embedding model)
    const embeddingResponse = await fetch(
      `https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: latestmessages })
      }
    );

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("Hugging Face embedding API error:", embeddingResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Embedding API error", details: errorText }), { status: 500 });
    }

    const embeddingData = await embeddingResponse.json();
    let embedding = embeddingData?.[0] || [];

    // Truncate embedding to 1000 elements to meet database constraints
    if (embedding.length > 1000) {
      embedding = embedding.slice(0, 1000);
    }

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = await collection.insertOne({
        vector: embedding,
        text: latestmessages
      });
      const insertedDoc = await collection.findOne({ _id: cursor.insertedId });
      docContext = JSON.stringify(insertedDoc?.text);
    } catch (err) {
      console.log("Error in database operation:", err);
      docContext = "";
    }

    const template = `You are an AI assistant who knows everything about Formula One.\n\nUse the below context to augment what you know about Formula One racing.\nThe context will provide you with the most recent page data from Wikipedia,\nthe official F1 website and others.\nIf the context doesn't include the information you need answer based on your\nexisting knowledge and don't mention the source of your information or\nwhat the context does or doesn't include.\n\n---------------\nSTART CONTEXT\n${docContext}\nEND CONTEXT\n---------------\nQUESTION:${latestmessages}\n---------------`;

    const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: template,
          max_new_tokens: 256
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face LLM API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "LLM API error", details: errorText }), { status: 500 });
    }

    const responseData = await response.json();
    console.log("Hugging Face LLM API raw response:", responseData);
    let generatedText = "";
    if (Array.isArray(responseData) && responseData[0]?.generated_text) {
      generatedText = responseData[0].generated_text;
    } else if (typeof responseData.generated_text === "string") {
      generatedText = responseData.generated_text;
    } else {
      generatedText = "Sorry, I couldn't generate a response.";
    }
    // Return in the format expected by useChat from @ai-sdk/react (array of messages, not wrapped in an object)
    return new Response(JSON.stringify([
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        role: "assistant",
        content: generatedText
      }
    ]), { status: 200 });



        }
        catch(err){
            console.log(err)
        }
    }

