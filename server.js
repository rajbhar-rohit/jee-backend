import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const questionSchema = new mongoose.Schema({
  subject: String,
  question: String,
  options: [String],
  answer: String,
});
const Question = mongoose.model("Question", questionSchema);

app.get("/generate-question", async (req, res) => {
  try {
    const subject = req.query.subject || "Physics";
    const prompt = `Generate a multiple-choice JEE ${subject} question with 4 options and the correct answer.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text().trim();

    const [question, ...options] = generatedText.split("\n");
    const answer = options.pop();

    const newQuestion = await Question.create({ subject, question, options, answer });
    res.json(newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/questions", async (req, res) => {
  const subject = req.query.subject;
  const filter = subject ? { subject } : {}; 
  const questions = await Question.find(filter);
  res.json(questions);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
