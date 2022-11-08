import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"

import {string, z} from 'zod'
import ShortUniqueId from 'short-unique-id'
import { authenticate } from "../plugins/authenticate"
import { request } from "http"
import { REPL_MODE_SLOPPY } from "repl"

export async function poolRoutes(fastify: FastifyInstance){



    fastify.get('/pools/count', async ()=>{

    const count = await prisma.pool.count()
    
    return { count }
    })
    
    //Nova rota para criar um bolao. Aula 2
    fastify.post('/pools', async (request, reply)=>{
     
        //Valida se receberemos um title obrigatoriamente e diz que sera uma string
       const createPoolBody = z.object({
        title: z.string(),
       })
    
       const {title} = createPoolBody.parse(request.body)
    
       //Gerar novo codigo aleatorio
       const generate = new ShortUniqueId({ length: 6})
       const code = String(generate()).toUpperCase()


       try {
            await request.jwtVerify()

            // Se passar para ca significa que o usuario esta autenticado e cria bolao com OwnerId
            await prisma.pool.create({
                data:{
                    title,
                    code,
                    ownerId: request.user.sub,
                    
                    //Quando o usuario existe é criado o user. Alem disto precisamos criar o participante tambem na respectiva tabela
                    //Ou seja quando um usuario cria um bolao obrigatoriamente ele precisa ser participante daquele bolao
                    participants:{
                        create: {
                            userId: request.user.sub,
                        }
                    }
                }
            })           
       } catch {
        //Cria usuario sem OwnerId
            await prisma.pool.create({
                data:{
                    title,
                    code   
                }
            })
       }
    

    
       return reply.status(201).send({code})
    })

    //Rota para entrar no bolao. Só é acessível se o usuario estiver autenticado
    fastify.post('/pools/join', 
    {
        onRequest: [authenticate]
    }, 
    async (request, reply) =>{

        //Valida se receberemos um code do bolao obrigatoriamente e diz que sera uma string
        console.log('1');
       const joinPoolBody = z.object({
        code: z.string(),
       })

       console.log('2');
       //Busca o codigo do bolao digitado pelo usuario. Pega no body pois nao vem na URL
       const { code } = joinPoolBody.parse(request.body)


       //Vamos validar se existe um bolao com o codigo digitado.
       // Alem disto verificaremos se ele ja fez parte do bolao usando o include.
       // O include é como um join no SQL
       const pool = await prisma.pool.findUnique({
            where:{
                code,
                },
            include: {
                    participants: {
                        where: {
                            userId: request.user.sub,
                        }
                    }
            }
            
       })

       //Se nao existir um bolao devolveramos um =a mensagem de erro
       if (!pool){
            reply.status(400).send({
                message: "Pool not found"
            })
       }

       // Se cair aqui significa que usuario já participa deste bolao
       if (pool.participants.length > 0){
            reply.status(400).send({
                message: "You already join this pool."
            })
       }

       //Se o bolao nao tiver dono associa este "primeiro" usuario como owner. Fazer update e colocar o valor do id no OwnerId
       if (!pool.ownerId) {
            await prisma.pool.update({
                where: {
                    id: pool.id
                },
                data: {
                    ownerId: request.user.sub,
                }
            })
       } 

       //Vamos incluir na tabela de participantes
       await prisma.participant.create({
            data:{
                poolId: pool.id,
                userId: request.user.sub,
            }
       })

       return reply.status(201).send()

    } )

    //Rota para saber quais boloes um usuario participa
    fastify.get('/pools', 
    {
        onRequest: [authenticate]
    }, async (request) =>{

        //O some indica que pelo menos um participante 
        // Como as informacoes que isto traz nao eh suficiente para a interface devemos trazer tambem todos os dados de owner 
        // Isto é feito com o include
        // O mesmo ocorre para _count que traz a quantidade de participantes daquele bolao
        // O mesmo para os 4 primeiros avatares dentro de take
        const pools = await prisma.pool.findMany({
            where:{
                participants:{
                    some: {
                        userId: request.user.sub,
                    }
                }
            },
            include: {
                _count: {
                    select: {
                        participants: true,
                    }
                },
                participants: {
                    select: {
                        id: true,

                        user: {
                          select: {
                            avatarUrl: true,
                          }  
                        },

                    },
                    take: 4,
                },
                owner: {
                    select:{
                        id: true,
                        name: true,
                    }
                }

            }
        })

        return { pools }

    } )

    //Rota para trazer todos os detalhes de um bolao
    fastify.get('/pools/:id',
    {
        onRequest: [authenticate],
    }, async (request) =>{

        const getPoolParams = z.object({
            id: z.string(),
        })

        //Pega via params pois vem na URL
        const { id } = getPoolParams.parse(request.params)

        //Faz a consulta na base
        const pool = await prisma.pool.findUnique({
            where:{
                id,
            },
            include: {
                _count: {
                    select: {
                        participants: true,
                    }
                },
                participants: {
                    select: {
                        id: true,

                        user: {
                          select: {
                            avatarUrl: true,
                          }  
                        },

                    },
                    take: 4,
                },
                owner: {
                    select:{
                        id: true,
                        name: true,
                    }
                }

            }
        })

        return { pool }
    })


}