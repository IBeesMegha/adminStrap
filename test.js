import { GoogleGenerativeAI } from "@google/generative-ai";
async function test() {
  const genAI = new GoogleGenerativeAI("api_key");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const result = await model.generateContent("Hello");
  console.log(result.response.text());
}
test();