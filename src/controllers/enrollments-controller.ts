import { AuthenticatedRequest } from "@/middlewares";
import enrollmentsService from "@/services/enrollments-service";
import { Response } from "express";
import httpStatus from "http-status";
import { request } from "@/utils/request";

export async function getEnrollmentByUser(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const enrollmentWithAddress = await enrollmentsService.getOneWithAddressByUserId(userId);

    return res.status(httpStatus.OK).send(enrollmentWithAddress);
  } catch (error) {
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export async function postCreateOrUpdateEnrollment(req: AuthenticatedRequest, res: Response) {
  const { cep }: {cep: string} = req.body.address;

  const cepFormat = new RegExp("^[0-9]{5}-[0-9]{3}$");

  if(cepFormat.test(cep) === false) {
    res.sendStatus(400);
    return;
  }

  const { data } = await request.get(`https://viacep.com.br/ws/${cep}/json/`);

  if (data.erro === true) {
    res.sendStatus(400);
    return;
  }
  
  try {
    await enrollmentsService.createOrUpdateEnrollmentWithAddress({
      ...req.body,
      userId: req.userId
    });

    return res.sendStatus(httpStatus.OK);
  } catch (error) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function getAddressFromCEP(req: AuthenticatedRequest, res: Response) {
  const { cep } = req.query as Record<string, string>;

  try {
    const address = await enrollmentsService.getAddressFromCEP(cep);
    res.status(httpStatus.OK).send(address);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NO_CONTENT);
    }
  }
}
