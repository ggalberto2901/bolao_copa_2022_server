import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function gameRoutes(fastify: FastifyInstance){

    fastify.get('/pools/:id/games',
    {
        onRequest: [authenticate], 
    }, async (request) =>{

        const getPoolParams = z.object({
            id: z.string(),
        })

        //Pega via params pois vem na URL
        const { id } = getPoolParams.parse(request.params)

        //Buscando os jogos daquele bolao.
        // Precisa trazer tambem se o usuario ja fez palpite naqueles jogos daquele bolao
        const games = await prisma.game.findMany({
            orderBy:{
                date: 'desc',
            },
            include:{
                guesses:{
                    where:{
                        participant:{
                            userId: request.user.sub,
                            poolId:id,
                        }
                    }
                }
            }

        })

        //Precisa tratar este retorno pois se apenas retornar games palpites virá como um array. 
        // Neste caso só pode haver um palpite por usuario por bolão.
        // Neste retorno o array guesses será retirado
        // No seu lugar entra guess além de todas as informacoes de game presente em ...game
        return { 
            games: games.map(game => {
                return {
                    ...game,
                    guess: game.guesses.length > 0 ? game.guesses[0] : null,
                    guesses: undefined,
                }
            })
        }

    })


}