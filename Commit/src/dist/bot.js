"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const mail_1 = require("./mail");
const db_1 = __importDefault(require("./db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bot = new node_telegram_bot_api_1.default(process.env.TELEGRAM_TOKEN, { polling: true });
var State;
(function (State) {
    State[State["NONE"] = 0] = "NONE";
    State[State["NOME"] = 1] = "NOME";
    State[State["EMAIL"] = 2] = "EMAIL";
    State[State["EMAIL_VERIFICACAO"] = 3] = "EMAIL_VERIFICACAO";
    State[State["CPF"] = 4] = "CPF";
    State[State["SENHA"] = 5] = "SENHA";
})(State || (State = {}));
let currentState = State.NONE;
let nome = '';
let email = '';
let cpf = '';
let senha = '';
let codigoConfirmacao = 0;
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
    try {
        switch (currentState) {
            case State.NONE:
                await bot.sendMessage(chatId, 'Bem-vindo ao cadastro! Qual é o seu nome?');
                currentState = State.NOME;
                break;
            case State.NOME:
                nome = text;
                await bot.sendMessage(chatId, 'Por favor, informe o seu e-mail:');
                currentState = State.EMAIL;
                break;
            case State.EMAIL:
                if (isValidEmail(text)) {
                    email = text;
                    codigoConfirmacao = Math.floor(100000 + Math.random() * 900000);
                    await (0, mail_1.sendVerificationEmail)(email, codigoConfirmacao);
                    await bot.sendMessage(chatId, 'Código de confirmação enviado para o seu e-mail. Por favor, digite o código recebido:');
                    currentState = State.EMAIL_VERIFICACAO;
                }
                else {
                    await bot.sendMessage(chatId, 'E-mail inválido. Tente novamente.');
                }
                break;
            case State.EMAIL_VERIFICACAO:
                if (parseInt(text) === codigoConfirmacao) {
                    await bot.sendMessage(chatId, 'E-mail confirmado! Agora, informe o seu CPF:');
                    currentState = State.CPF;
                }
                else {
                    await bot.sendMessage(chatId, 'Código incorreto. Por favor, tente novamente.');
                }
                break;
            case State.CPF:
                cpf = text;
                await bot.sendMessage(chatId, 'Crie uma senha:');
                currentState = State.SENHA;
                break;
            case State.SENHA:
                senha = await bcrypt_1.default.hash(text, 10);
                await saveToDatabase(nome, email, cpf, senha);
                await bot.sendMessage(chatId, 'Cadastro realizado com sucesso!');
                currentState = State.NONE;
                break;
        }
    }
    catch (error) {
        console.error(error);
        await bot.sendMessage(chatId, 'Ocorreu um erro. Tente novamente.');
    }
});
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
async function saveToDatabase(nome, email, cpf, senha) {
    try {
        const client = await db_1.default.connect();
        await client.query('INSERT INTO usuarios (nome, email, cpf, senha) VALUES ($1, $2, $3, $4)', [nome, email, cpf, senha]);
        client.release();
    }
    catch (error) {
        console.error('Erro ao salvar no banco de dados:', error);
    }
}
