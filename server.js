import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Проверяем API-ключ
if (!process.env.GEMINI_API_KEY) {
    console.error("ОШИБКА: API-ключ Gemini не найден в .env");
    process.exit(1);
}

// Подключение Gemini
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Проверка работы сервера
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "UniMate сервер работает!"
    });
});

// Обработка сообщений AI
app.post("/api/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Сообщение пустое"
            });
        }

        console.log("Вопрос пользователя:", message);

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: message,
            config: {
                systemInstruction:
                    "Ты UniMate — дружелюбный виртуальный помощник студента. " +
                    "Помогай с учёбой, программированием, SQL, HTML, CSS, JavaScript, " +
                    "расписанием и подготовкой к экзаменам. " +
                    "Отвечай на русском языке, понятно, структурированно и простыми словами. " +
                    "Если пользователь просто здоровается, поздоровайся в ответ."
            }
        });

        const answer = response.text;

        console.log("Ответ Gemini получен!");

        res.json({
            reply: answer
        });

    } catch (error) {
        console.error("Ошибка Gemini:", error.message);

        res.status(500).json({
            error: error.message || "Ошибка подключения к Gemini"
        });
    }
});

// Запуск
app.listen(PORT, "0.0.0.0", () => {
    console.log("--------------------------------");
    console.log("UniMate AI успешно запущен!");
    console.log(`Сервер: http://localhost:${PORT}`);
    console.log(`Проверка: http://localhost:${PORT}/api/health`);
    console.log("--------------------------------");
});

