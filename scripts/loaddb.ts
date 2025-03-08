import {DataAPIClient} from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter"
import Groq from "groq-sdk"
import "dotenv/config"
import { HfInference } from "@huggingface/inference"


type SimilarityMetric= "cosine"|"dot_product"|"euclidean"




const {ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    GROQ_API_KEY,
    HUGGINGFACE_API_KEY}=process.env

const groq = new Groq({
    apiKey: GROQ_API_KEY
    })
const f1Data=[
        "https://en.wikipedia.org/wiki/Formula_One",
        "http://formula1.com/en/latest",
        "https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship",
        "https://en.wikipedia.org/wiki/List_of_Formula_One_Grands_Prix",
        "https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship",
        "https://en.wikipedia.org/wiki/List_of_Formula_One_driver_records",
        "https://en.wikipedia.org/wiki/2023_Formula_One_World_Championship",
        "https://en.wikipedia.org/wiki/2021_Formula_One_World_Championship"

    ]
const client=new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db=client.db(ASTRA_DB_API_ENDPOINT,{namespace:ASTRA_DB_NAMESPACE})
const splitter=new RecursiveCharacterTextSplitter(
    {
        chunkSize:112,
        chunkOverlap:15
    }
)
const createCollection=async(similaritymetric:SimilarityMetric="dot_product")=>{
    const res=await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 384,
            metric: similaritymetric
        }
    })
    console.log(res)
}

// const { HfInference } = require("huggingface");

const hf = new HfInference(HUGGINGFACE_API_KEY || "")


const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);

    for await (const url of f1Data) {
        const content = await scrapePage(url);
        const chunks = await splitter.splitText(content);

        for await (const chunk of chunks) {
            // ✅ Directly replacing OpenAI with Hugging Face embeddings
            const embedding = await hf.featureExtraction({
                model: "sentence-transformers/all-MiniLM-L6-v2", // ✅ 384-dimension embeddings
                inputs: chunk
            })

            // ✅ Store embedding in AstraDB
            const res = await collection.insertOne({
                $vector: embedding, // Replace with actual embedding vector
                text: chunk,
            })
        console.log(res)
        }
    }
}

const scrapePage=async(url:string)=>{
    const loader=new PuppeteerWebBaseLoader(url,{
        launchOptions:{
            headless:true,
        },
        gotoOptions:{
            waitUntil:"domcontentloaded",
        },
        evaluate: async(page,browser)=>{
            const result=await page.evaluate(()=>document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}
createCollection().then(()=>loadSampleData())