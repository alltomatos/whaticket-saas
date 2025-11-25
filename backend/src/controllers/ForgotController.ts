import { v4 as uuid } from "uuid";
import { Request, Response } from "express";
import SendMail from "../services/ForgotPassWordServices/SendMail";
import ResetPassword from "../services/ResetPasswordService/ResetPassword";
type IndexQuery = { email?: string; token?: string; password?: string };

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.params as IndexQuery;
  const TokenSenha = uuid();
  const forgotPassword = await SendMail(email, TokenSenha);

  if (forgotPassword.status === 200) {
    return res.status(200).json({ message: "E-mail enviado com sucesso" });
  } else if (forgotPassword.status === 404) {
    return res.status(404).json({ error: forgotPassword.message });
  } else {
    // Inclui detalhes se quiser debugar
    return res.status(forgotPassword.status || 500).json({ error: forgotPassword.message, details: forgotPassword.error });
  }
};

export const resetPasswords = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email, token, password } = req.params as IndexQuery;
  const resetPassword = await ResetPassword(email, token, password);
  if (!resetPassword) {
    return res.status(200).json({ message: "Senha redefinida com sucesso" });
  }
  return res.status(404).json({ error: "Verifique o Token informado" });
};
