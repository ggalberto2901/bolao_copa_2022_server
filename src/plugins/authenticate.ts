import { FastifyRequest } from "fastify";

export async function authenticate( request: FastifyRequest) {

    // Este metodo verifica se existe um token JWT e se é valido
    await request.jwtVerify()

}