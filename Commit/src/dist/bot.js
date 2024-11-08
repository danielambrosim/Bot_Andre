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
// import TelegramBot from 'node-telegram-bot-api';
// import nodemailer from 'nodemailer';
// // Configuração do bot Telegram
// const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true });
// // Configuração do serviço de e-mail com nodemailer
// const transporter = nodemailer.createTransport({
//     host: 'smtp.seuservidor.com', // substitua pelo SMTP do seu provedor
//     port: 587,                     // porta usada pelo SMTP do seu provedor
//     auth: {
//         user: 'seu_email',         // substitua pelo seu e-mail
//         pass: 'sua_senha',         // substitua pela sua senha do e-mail
//     },
// });
// // Variáveis para rastrear o estado e informações do usuário
// enum State { NONE, EMAIL, EMAIL_VERIFICACAO }
// let userState: { [key: number]: State } = {};
// let userData: { [key: number]: { email?: string, codigo?: number } } = {};
// // Função para enviar o código de confirmação por e-mail
// function enviarCodigoEmail(destino: string, codigo: number) {
//     const mailOptions = {
//         from: 'seu_email',       // e-mail remetente
//         to: destino,             // e-mail destinatário
//         subject: 'Código de Confirmação',
//         text: `Seu código de confirmação é: ${codigo}`,
//     };
//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error('Erro ao enviar e-mail:', error);
//         } else {
//             console.log('E-mail enviado:', info.response);
//         }
//     });
// }
// // Início do bot com a mensagem de boas-vindas
// bot.onText(/\/start/, (msg) => {
//     const chatId = msg.chat.id;
//     bot.sendMessage(chatId, "Bem-vindo ao cadastro! Por favor, informe o seu e-mail:");
//     userState[chatId] = State.EMAIL;
//     userData[chatId] = {}; // Cria um espaço para os dados deste usuário
// });
// // Lógica para lidar com as mensagens do usuário e o fluxo do cadastro
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text || '';
//     // Verifica o estado atual do usuário
//     switch (userState[chatId]) {
//         case State.EMAIL:
//             // Salva o e-mail e gera o código de confirmação
//             userData[chatId].email = text;
//             const codigo = Math.floor(100000 + Math.random() * 900000); // Gera um código de 6 dígitos
//             userData[chatId].codigo = codigo;
//             // Envia o código para o e-mail do usuário
//             enviarCodigoEmail(text, codigo);
//             bot.sendMessage(chatId, "Código de confirmação enviado para o seu e-mail. Digite o código recebido:");
//             userState[chatId] = State.EMAIL_VERIFICACAO;
//             break;
//         case State.EMAIL_VERIFICACAO:
//             // Verifica se o código digitado pelo usuário é o mesmo que foi enviado por e-mail
//             if (parseInt(text) === userData[chatId].codigo) {
//                 bot.sendMessage(chatId, "E-mail confirmado! Cadastro concluído com sucesso.");
//                 userState[chatId] = State.NONE;
//                 delete userData[chatId]; // Limpa os dados do usuário após o cadastro
//             } else {
//                 bot.sendMessage(chatId, "Código incorreto. Por favor, tente novamente.");
//             }
//             break;
//         default:
//             bot.sendMessage(chatId, "Envie /start para iniciar o cadastro.");
//             break;
//     }
// });
