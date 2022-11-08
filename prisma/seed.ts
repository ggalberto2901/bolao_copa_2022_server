import { prisma, Prisma, PrismaClient, PrismaClient } from '@prisma/client'

//Nao colocamos log para nao encher de logs
const prisma = new PrismaClient()

async function main(){

    const user = await prisma.user.create({
        data:{
            name: 'John Doe',
            email: 'john.doe@gmail.com',
            avatarUrl: 'https://github.com/diego3g.png',

        }
    })

    const pool = await prisma.pool.create({
        data:{
            title: 'Example Pool',
            code: 'BOL123',
            ownerId: user.id,

// As linhas abaixo criam um participante quando criamos um bolao e 
//   associamos a pessoa que criou o bolao a um primeiro participante
            participants: {
                create:{
                    userId: user.id,
                }
            }

        }
    })

    //Sempre gravar data com timestamp
    // Neste jogo nao tem palpite criado
    await prisma.game.create({
        data:{
            date: '2022-11-02T10:00:00.201Z',
            firstTeamCountryCode: 'DE',
            secondTeamCountryCode: 'BR',
        }
    })

    //Gerar jogo com palpite gerado
    await prisma.game.create({
        data:{
            date: '2022-11-03T10:00:00.201Z',
            firstTeamCountryCode: 'BR',
            secondTeamCountryCode: 'AR',

            guesses: {
                create:{
                    firstTeamPoints: 2,
                    secondTeamPoints: 1,

                    participant:{
                        connect:{
                            userId_poolId:{
                                userId: user.id,
                                poolId: pool.id,
                            }
                        }
                    }

                }
            }
        }
    })


    // Poderiamos criar a tabela de participantes assim mas melhor da maneira acima
    //const participant = await prisma.participant.create({
    //    data: {
    //        userId = user.id,
    //        poolId = pool.id,
    //    }
    //})

}

main()