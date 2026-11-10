import { createHmac, timingSafeEqual } from "node:crypto";

export type AuthTokenPayload = {
    sub: number;
    email: string;
    name: string;
};

type JwtPayload = AuthTokenPayload & {
    iat: number;
    exp: number;
};

const tokenTtlSeconds = 60 * 60 * 24;

function getSecret() {
    const secret = process.env.JWT_SECRET;

    if (secret) {
        return secret;
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET deve ser configurado em produção");
    }

    return "dev-secret-change-me";
}

function encodeBase64Url(value: string) {
    return Buffer.from(value).toString("base64url");
}

function sign(input: string) {
    return createHmac("sha256", getSecret()).update(input).digest("base64url");
}

export function signJwt(payload: AuthTokenPayload) {
    const now = Math.floor(Date.now() / 1000);
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(
        JSON.stringify({
            ...payload,
            iat: now,
            exp: now + tokenTtlSeconds,
        }),
    );
    const unsignedToken = `${header}.${body}`;

    return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifyJwt(token: string): JwtPayload {
    const [header, body, signature] = token.split(".");

    if (!header || !body || !signature) {
        throw new Error("Token inválido");
    }

    const unsignedToken = `${header}.${body}`;
    const expectedSignature = sign(unsignedToken);
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
        throw new Error("Token inválido");
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.sub || !payload.email || !payload.name || payload.exp < now) {
        throw new Error("Token inválido ou expirado");
    }

    return payload;
}
