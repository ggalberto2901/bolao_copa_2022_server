import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"

import {z} from 'zod'
import { authenticate } from "../plugins/authenticate"

export async function authRoutes(fastify: FastifyInstance){

    //Vai receber a requsicao e retornar dados do usuario logado. Chama o metodo de validar o token JWT que está em outro arquivo
    fastify.get('/me', 
    {
        onRequest: [authenticate],
    },
    async (request) =>{
        return { user: request.user }

    })

    //Esta rota ira devolver o token JWT
    fastify.post('/users', async (request) => {       
        
        //Verifica se tem um acess-token no corpo da request do tipo string
        const createUserBody = z.object({
            access_token: z.string(),
        })

        const { access_token } = createUserBody.parse(request.body)

        //Se comunica com o google na URL e enviamos no header da requisicao o access_token recebido do mobile
        // O google vai entender que quem está logado é o possuidor do access_token passado como parametro 
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${ access_token }`,
            }
        })

        const userData = await userResponse.json()

        //Faz uma validacao para ver se o que vem do google é do formato abaixo
        const userInfoSchema = z.object({
            id: z.string(),
            email: z.string().email(),
            name: z.string(),
            picture: z.string().url(),
        })

        const userInfo = userInfoSchema.parse(userData)

        //Busca usuario logado no Google no banco de dados local para ver se existe
        let user = await prisma.user.findUnique({
            where: {
                googleId: userInfo.id,
            }
        })

        //Se usuario nunca logou na nossa aplicacao adiciona ele no banco de dados
        if (!user){

            user = await prisma.user.create({
                data: {
                    googleId: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    avatarUrl: userInfo.picture,
                }
            })

        }

        //Criando o token JWT. Nele vc pode colocar outras informacoes. O primeiro array é para isto
        // O segundo array é para as configuracoes. Importante é o expiresIn que
        // Nao colocar senha. E quanto mais informacoes colocar maior o token ficará 
        // O token é um hash e nao uma criptografia
        const token = fastify.jwt.sign({
            name: user.name,
            avatarUrl: user.avatarUrl,
        }, {
            sub: user.id,
            expiresIn: '7 days',
        })

        return { token }

    })

}