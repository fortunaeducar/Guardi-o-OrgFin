import { GoogleGenAI, Type } from "@google/genai";
import { Category, Transaction, SavingsLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for the "Guardião OrgFin" persona
const SYSTEM_INSTRUCTION = `
Você é o "Guardião OrgFin", um mentor financeiro para professores empreendedores. 
Sua voz é pedagógica, empática e focada em resultados.
Seu objetivo é classificar gastos no método Kakebo e ajudar o usuário a poupar.
As categorias são:
1. Sobrevivência (Essenciais, contas fixas, aluguel, luz)
2. Lazer e Vícios (Restaurantes, streaming, hobbies, supérfluos)
3. Cultura e Estudo (Livros, cursos, software de trabalho)
4. Extras (Reparos, emergências, presentes)
`;

export const classifyExpense = async (description: string, amount: number): Promise<Category> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Classifique o seguinte gasto: "${description}" no valor de R$ ${amount}. Responda APENAS com uma das seguintes chaves JSON: "SURVIVAL", "LEISURE", "CULTURE", "EXTRAS".`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: ["SURVIVAL", "LEISURE", "CULTURE", "EXTRAS"]
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    switch (result.category) {
      case "SURVIVAL": return Category.SURVIVAL;
      case "LEISURE": return Category.LEISURE;
      case "CULTURE": return Category.CULTURE;
      case "EXTRAS": return Category.EXTRAS;
      default: return Category.EXTRAS;
    }
  } catch (error) {
    console.error("Error classifying expense:", error);
    return Category.EXTRAS; // Default fallback
  }
};

export const getDiagnosisAdvice = async (survivalExpenses: Transaction[], totalRevenue: number): Promise<string> => {
  try {
    const expensesList = survivalExpenses
      .map(t => `- ${t.description}: R$ ${t.amount.toFixed(2)}`)
      .join("\n");

    const prompt = `
      O usuário é um professor empreendedor.
      A categoria 'Sobrevivência' atingiu mais de 60% da receita prevista (R$ ${totalRevenue.toFixed(2)}).
      Gastos de sobrevivência atuais:
      ${expensesList}

      Como o Guardião OrgFin, analise a lista acima.
      1. Identifique 2 ou 3 itens que parecem altos ou renegociáveis.
      2. Faça perguntas reflexivas diretas sobre esses itens para estimular a economia.
      3. Seja breve, empático, mas firme contra o "Lobo dos Gastos".
      4. Sugira uma ação imediata.
      
      Não use formatação Markdown complexa, apenas texto corrido e quebras de linha.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for better reasoning capabilities
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "O Lobo está grande demais! Revise suas contas fixas imediatamente.";
  } catch (error) {
    console.error("Error getting diagnosis:", error);
    return "Detectamos um desequilíbrio. Revise seus gastos essenciais.";
  }
};

export const generateFinancialReport = async (transactions: Transaction[], revenue: number, savingsLog: SavingsLog[]): Promise<string> => {
  try {
    const expenses = transactions.map(t => `- ${t.date.toLocaleDateString()} | ${t.category}: ${t.description} (R$ ${t.amount.toFixed(2)})`).join("\n");
    const savings = savingsLog.map(s => `- ${s.date.toLocaleDateString()} | ${s.description} (R$ ${s.amount.toFixed(2)})`).join("\n");
    
    const totalExpenses = transactions.reduce((acc, t) => acc + t.amount, 0);
    const totalSavings = savingsLog.reduce((acc, s) => acc + s.amount, 0);
    const balance = revenue - totalExpenses + totalSavings;

    const prompt = `
      Gere um "Relatório Oficial do Guardião OrgFin" com tom pedagógico e estratégico.
      
      DADOS FINANCEIROS:
      - Receita Prevista: R$ ${revenue.toFixed(2)}
      - Total Gasto (Lobo): R$ ${totalExpenses.toFixed(2)}
      - Total Economizado (Porquinho): R$ ${totalSavings.toFixed(2)}
      - Saldo Real: R$ ${balance.toFixed(2)}
      
      HISTÓRICO DE GASTOS:
      ${expenses || "Nenhum gasto registrado."}

      HISTÓRICO DE ECONOMIAS:
      ${savings || "Nenhuma economia registrada."}

      ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:
      
      TITULO: 📜 Relatório Oficial do Guardião OrgFin

      1. DIAGNÓSTICO GERAL
      Faça uma breve análise se o usuário está mais alimentando o Lobo (gastos) ou o Porquinho (economia). Use metáforas.

      2. RAIO-X DO KAKEBO
      Analise a distribuição dos gastos. Alguma categoria está exagerada? (Sobrevivência, Lazer, Cultura, Extras).

      3. PONTOS DE ATENÇÃO
      Cite especificamente 2 ou 3 gastos que poderiam ser evitados ou reduzidos. Seja direto.

      4. VEREDITO E PLANO DE AÇÃO
      Dê 3 passos práticos para o próximo ciclo. Termine com uma frase motivacional para um professor empreendedor.

      IMPORTANTE:
      - Use emojis para ilustrar.
      - Seja rigoroso com o desperdício, mas gentil com a pessoa.
      - Não use formatação Markdown como negrito (**texto**), use CAIXA ALTA para destaques ou emojis, pois a visualização será em texto simples.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Erro ao conectar com o Guardião. Tente novamente mais tarde.";
  }
};