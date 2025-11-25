import nodemailer from "nodemailer";
import sequelize from "sequelize";
import database from "../../database";
import Setting from "../../models/Setting";
import { logger } from "../../utils/logger";
import { config } from "dotenv";
config();

interface UserData {
  companyId: number;
}

const filterEmail = async (email: string) => {
  const sql = `SELECT * FROM "Users" WHERE email = '${email}'`;
  const result = await database.query(sql, {
    type: sequelize.QueryTypes.SELECT
  });
  return { hasResult: result.length > 0, data: [result] };
};

const insertToken = async (email: string, tokenSenha: string) => {
  const sqls = `UPDATE "Users" SET "resetPassword"= '${tokenSenha}' WHERE email = '${email}'`;
  const results = await database.query(sqls, {
    type: sequelize.QueryTypes.UPDATE
  });
  return { hasResults: results.length > 0, datas: results };
};

const SendMail = async (email: string, tokenSenha: string) => {
  try {
    // Valida se o e-mail existe no banco
    const { hasResult, data } = await filterEmail(email);
    if (!hasResult) {
      return { status: 404, message: "E-mail não encontrado" };
    }
    const userData = data[0][0] as UserData;
    if (!userData || userData.companyId === undefined) {
      return { status: 404, message: "Dados do usuário não encontrados" };
    }

    // Atualiza token no banco
    await insertToken(email, tokenSenha);

    // Configurações SMTP
    const logo = `${process.env.BACKEND_URL}/public/logotipos/login.png`;
    //const getBase64 = getBase64FromUrl(logo).then(base64String => { return base64String; });

    const companyName = process.env.COMPANY_NAME || "Whaticket SaaS";
    const urlSmtp = process.env.MAIL_HOST;
    const port = process.env.MAIL_PORT;
    const userSmtp = process.env.MAIL_USER;
    const passwordSmtp = process.env.MAIL_PASS;
    const fromEmail = process.env.MAIL_FROM;
    const useSecure = process.env.MAIL_SECURE === "true";

    // Cria transporter Nodemailer
    const transporter = nodemailer.createTransport({
      host: urlSmtp,
      port: Number(port),
      secure: useSecure,
      auth: { user: userSmtp, pass: passwordSmtp }
    });

    // Dados do e-mail
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Redefinição de Senha - ${companyName}`,
      html: `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="pt">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <title>Redefinição de Senha</title>
    <style type="text/css">
        body {
            width:100%!important;
            font-family:roboto, 'helvetica neue', helvetica, arial, sans-serif;
            -webkit-text-size-adjust:100%;
            -ms-text-size-adjust:100%;
            padding:0;
            margin:0;
            background: #F8F9FD;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 30px auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.07);
            padding: 0;
        }
        .logo {
            width: 200px;
            margin: 35px auto 15px auto;
            display: block;
        }
        .main-title {
            font-size: 26px;
            color: #071f4f;
            margin: 0 0 14px 0;
            font-family: roboto, 'helvetica neue', helvetica, arial, sans-serif;
            font-weight: bold;
            text-align: center;
            line-height: 1.2;
        }
        .message {
            font-size: 16px;
            color: #222;
            line-height: 1.6;
            margin: 0 0 22px 0;
            text-align: center;
        }
        .code-box {
            font-size: 2rem;
            letter-spacing: 4px;
            font-weight: bold;
            background: #f8f9fd;
            padding: 18px 0;
            margin: 16px 0 32px 0;
            border-radius: 8px;
            color: #071f4f;
            text-align: center;
        }
        .info-title {
            font-size: 18px;
            color: #212121;
            font-weight: bold;
            text-align: center;
            margin-top: 30px;
            margin-bottom: 8px;
        }
        .info-message {
            font-size: 15px;
            color: #131313;
            text-align: center;
            margin-bottom: 18px;
        }
        .footer {
            text-align: center;
            padding: 16px 0 16px 0;
            font-size: 12px;
            color: #888;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 98%!important;
                padding: 0!important;
            }
            .logo {
                width: 140px!important;
            }
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F8F9FD">
        <tr>
            <td align="center">
                <table class="container" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center" style="padding:0 30px;">
                            <img src="${logo}" alt="Logo ${companyName}" class="logo">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:0 30px;">
                            <h1 class="main-title">Bem-vindo à ${companyName}</h1>
                            <p class="message">Você solicitou recuperação de senha!</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:0 30px;">
                            <h2 class="info-title">Código de Verificação:</h2>
                            <div class="code-box">${tokenSenha}</div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:0 30px;">
                            <h2 class="info-title">Está com dúvidas?</h2>
                            <p class="info-message">Entre em contato agora mesmo conosco.</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            Você está recebendo este e-mail porque foi solicitada a recuperação de senha.<br>
                            Caso não tenha solicitado, ignore esta mensagem.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `
    };

    // Envio do e-mail
    const info = await transporter.sendMail(mailOptions);
    logger.info("E-mail enviado: " + info.response);
    return { status: 200, message: "E-mail enviado com sucesso" };

  } catch (error: any) {
    logger.error("Erro ao enviar e-mail:", error?.message || error);
    // Opcional: pode diferenciar erro de SMTP, erro de banco etc.
    if (
      error &&
      error.responseCode &&
      error.responseCode === 535 // Erro de autenticação SMTP
    ) {
      return { status: 401, message: "Usuário ou senha SMTP inválidos", error: error.message };
    }
    return { status: 500, message: "Erro ao enviar e-mail", error: error?.message || error };
  }
};

export default SendMail;
