import Fastify from 'fastify'
import cors from '@fastify/cors'

import jwt from '@fastify/jwt'

import { poolRoutes } from './routes/pool'
import { guessRoutes } from './routes/guess'
import { userRoutes } from './routes/user'
import { authRoutes } from './routes/auth'
import { gameRoutes } from './routes/game'


async function bootstrap(){ 
    const fastify = Fastify({
        logger: true,
    })

    //Congiguracao do cors
    // Origin igual a true significa que todas as aplicacoes pode acessar o backend
    await fastify.register(cors, {
        origin: true,
        //origin: 'www.rocketseat.com.br'. Se quisermos travar para apenas um dominio por exemplo
    })

    //Cria o Token JWT. Usei um secgredo aleatorio chamado nlwcopa
    // É importante que o segredo esteja em uma variavel de ambiente no ambiente de producao
    await fastify.register(jwt, {
       secret: 'nlwcopa'
    })


    //Para importar as rotas de auth
    await fastify.register(authRoutes);

    //Para importar as rotas de game
    await fastify.register(gameRoutes);

    //Para importar as rotas de user
    await fastify.register(userRoutes);

    //Para importar as rotas de guess
    await fastify.register(guessRoutes);

    //Para importar as rotas de pool
    await fastify.register(poolRoutes);

    //A opcao host abaixo é para o mobile funcionar
    await fastify.listen({ port: 3333, host: '0.0.0.0' })


    //Criando rotas
    //http://localhost/pools/count
    //Transferi na aula 4 para o arquivo dentro de routes/pool.ts. Vou apagar as demais rotas 
    // e deixar apenas esta comentada para saber como tudo comecou
    //fastify.get('/pools/count', async ()=>{

    //Consigo fazer qualquer operacao na tabela. Ele consegue enxergar a tabela
    // Por exemplo o metodo findMany faz um select. Para ver metodos CTRL+Espaco
    // O await espera o codigo ser executado para depois seguir com o restante do codigo
    // O codigo abaixo faz um select no banco de dados e traz todos os boloes que iniciam com a letra D
    /* const pools = await prisma.pool.findMany({
       where: {
        code: {
            startsWith: 'D'
        }
       }
    })
    return { pools }
    */

    //    const count = await prisma.pool.count()
    
    //    return { count }
    //})

}

bootstrap()