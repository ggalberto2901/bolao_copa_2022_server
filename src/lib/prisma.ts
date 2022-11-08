import { PrismaClient } from "@prisma/client";

//Esta linha cria a conexão com o banco de dados configurado
export const prisma = new PrismaClient({
    //Vai logar todas as queries disparadas no banco de dados.
    log: ['query'],
})
