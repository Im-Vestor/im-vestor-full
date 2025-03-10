import { User } from "@prisma/client";
import { db } from "~/server/db";

export function generateCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export async function createReferralLink(
  referralToken: string,
  referredId: string,
  referredFirstName: string,
  referredLastName: string,
) {
  const referralUser = await db.user.findUnique({
    where: { referralCode: referralToken },
  });

  await db.referral.create({
    data: {
      name: `${referredFirstName} ${referredLastName}`,
      referrerId: referralUser?.id ?? "",
      referredId: referredId,
    },
  });
}
