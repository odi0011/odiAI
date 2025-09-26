import dotenv from "dotenv";
dotenv.config();

export const config = {
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    app: {
        port: process.env.PORT || 3000,
        baseUrl: process.env.APP_BASE_URL,
    },
    gitee: {
        clientId: process.env.GITEE_CLIENT_ID,
        clientSecret: process.env.GITEE_CLIENT_SECRET,
        callbackUrl: `${process.env.APP_BASE_URL}${process.env.GITEE_CALLBACK_PATH}`,
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackUrl: `${process.env.APP_BASE_URL}${process.env.GITHUB_CALLBACK_PATH}`,
    },
};
