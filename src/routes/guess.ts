import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"


export async function guessRoutes(fastify: FastifyInstance){
    //Rota para contar a quantidade de palpites
    fastify.get('/guesses/count', async ()=>{

        const count = await prisma.guess.count()
    
        return { count }
    })  

    fastify.post('/pools/:poolId/games/:gameId/guesses',
    {
        onRequest:[authenticate]
    }, async (request, reply) =>{

        //Validar para nao vir vazio
        const createGuessParams = z.object({
            poolId: z.string(),
            gameId: z.string(),
        })

        //Vamos validar o recebimento dos 2 valores do palpite de cada time
        // Estes 2 valores virão no corpo da requisicao e não na URL
        const createGuessBody = z.object({
            firstTeamPoints: z.number(),
            secondTeamPoints: z.number(),
        })

        //Pegando os valores da URL
        const { poolId, gameId } = createGuessParams.parse(request.params)

        //Pegando os valores do body
        const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(request.body)

        //Fazendo validacoes
        const participant = await prisma.participant.findUnique({
            where:{
                userId_poolId: {
                    poolId,
                    userId: request.user.sub,
                }
            }
        })

        //Se for vazio significa que este usuario não faz parte deste bolão
        if (!participant){
            return reply.status(400).send({
                message: "You are not allowed to create a guess inside this pool"
            })
        }

        //Outra validacao eh se este usuario ja fez um palpite para este jogo neste bolao. Ele nao pode fazer 2
        const guess = await prisma.guess.findUnique({
            where:{
                participantId_gameId:{
                    participantId: participant.id,
                    gameId
                }
            }
        })

        //Se entrar aqui significa que o usuario ja fez um palpite para o jogo e nao pode fazer outro
        if (guess){
            return reply.status(400).send({
                message: "You already sent a guess to this game on this pool"
            })

        }

        //Procura pelo jogo enviado na URL
        const game = await prisma.game.findUnique({
            where:{
                id: gameId,
            }
        })

        //Verifica se o game existe. 
        if(!game){
            return reply.status(400).send({
                message: "Game not found"
            })
        }

        //Verifica se a data do jogo é inferior a data de hoje
        if(game.date < new Date()) {
            return reply.status(400).send({
                message: "You cannot send guesses after the game date."
            })
        }

        await prisma.guess.create({
            data:{
                gameId,
                participantId: participant.id,
                firstTeamPoints,
                secondTeamPoints

            }
        })

        return reply.status(201).send()


    })

}